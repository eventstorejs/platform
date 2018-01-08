import { DynamoDB } from 'aws-sdk'
import { injectable, inject } from 'inversify'
import * as moment from 'moment'
import { chunk } from 'lodash'
import * as t from 'io-ts'
import { S3 } from 'aws-sdk'
import { Config, Utils } from '@eventstorejs/core'
import { DYNAMO_TOKEN, S3_TOKEN } from '@eventstorejs/aws'
import { SagaNotFoundError, SagaState } from '../definitions'
import { Event } from '@eventstorejs/eventstore'
import { logger } from '@eventstorejs/request'

// const lz = require('lzutf8')

const log = logger('saga')

export interface AssociationAttribute {
  sagaType: string
  name?: string
  type?: t.Type<Event>,
  external?: {
    name: string,
    context: string,
    aggregateType: string
  },
  value?: any
  isGlobal: boolean
}

// Max Items Size is 400KB but includes all the other stuff. To prevent errors use 300KB
const MAX_ATTRIBUTES_SIZE = 300 * 1000

@injectable()
export class SagaStore {

  private _cache: { [sagaId: string]: any } = {}

  constructor (
    @inject(Config) private config: Config,
    @inject(DYNAMO_TOKEN) private db: DynamoDB.DocumentClient,
    @inject(S3_TOKEN) private s3: S3) {

  }

  public async findOne (sagaId: string): Promise<SagaState> {
    log.info(`Getting saga for id ${sagaId}`)
    if (this._cache[sagaId]) {
      log.info(`Found saga in cache`)
      return this._cache[sagaId]
    }
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/saga') as string,
      KeyConditionExpression: 'sagaId = :s',
      ExpressionAttributeValues: {
        ':s': sagaId
      }
    }

    const res = await this.db.query(params).promise()
    if (!res.Items || res.Items.length === 0) {
      throw new SagaNotFoundError(`Saga not found for ${sagaId}`)
    }
    log.debug(`Saga ${sagaId} found`)
    return this.mapSaga(res.Items[0] as any)
  }

  public async findByAssociation (assocation: AssociationAttribute): Promise<Array<SagaState>> {
    log.info(`Getting saga for attributeName ${assocation.name} with value: ${assocation.value}`)
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/saga-association') as string,
      KeyConditionExpression: 'associationKey = :s',
      ExpressionAttributeValues: {
        ':s': this.sanitizeAssociationName(assocation)
      }
    }

    const res = await this.db.query(params).promise()
    if (!res.Items || res.Items.length === 0) {
      log.debug(`No sagas matching associtaion found`)
      return []
    }
    const cachedResult = []
    for (const s of res.Items.map(s => s.sagaId)) {
      if (!this._cache[s]) {
        log.info(`not all sagas in cache. cancel`)
        break
      }
      cachedResult.push(this._cache[s])
    }
    if (cachedResult.length === res.Items.length) {
      log.info(`All sagas in cache. return cached reult`)
      return cachedResult.map(s => this.mapSaga(s))
    }
    const sagaParams = {
      RequestItems: {
        [await this.config.resolve<string>('eventstore/tables/saga') as string]: {
          Keys: res.Items.map(s => ({ sagaId: s.sagaId }))
        }
      }
    }

    const sagas = await this.db.batchGet(sagaParams).promise()
    if (!sagas.Responses) {
      log.warn(`Found matching assocations but not the corresping saga`)
      return []
    }
    // .map((i: any) => this.mapSaga(i))
    const resultingSagas = []
    for (const s of sagas.Responses[await this.config.resolve<string>('eventstore/tables/saga') as string]) {
      if (!s.attributes) {
        log.debug(`Attributes not found. Resolving from s3`)
        s.attributes = (await this.s3.getObject({
          Bucket: await this.config.resolve<string>('eventstore/bucket') as string,
          Key: `saga/${s.sagaId}.json`
        }).promise()).Body
      }
      resultingSagas.push(this.mapSaga(s as any))
    }
    return resultingSagas
  }

  public async put (saga: SagaState, associationAttributes: Array<AssociationAttribute> = []) {
    let allAssocationsKeys: Array<any> = []
    if (associationAttributes.length > 0) {
      const assocationsToDelete = saga._associationKeys || []
      const assocationsToCreate = associationAttributes.map(a => ({
        associationKey: this.sanitizeAssociationName(a),
        sagaId: saga.sagaId
      }))
      allAssocationsKeys = assocationsToCreate.map(a => a.associationKey)
      // remove duplicates
      for (let i = 0; i < assocationsToDelete.length; i++) {
        for (let j = 0; j < assocationsToCreate.length; j++) {
          if (assocationsToDelete[i] === assocationsToCreate[j].associationKey) {
            assocationsToDelete.splice(i, 1)
            assocationsToCreate.splice(j, 1)
          }
        }
      }
      const associtaionUpdates = [
        ...assocationsToCreate.map(a => ({ PutRequest: { Item: a } })),
        ...assocationsToDelete.map(a => ({ DeleteRequest: { Key: { associationKey: a, sagaId: saga.sagaId } } }))
      ]
      const chunks = chunk(associtaionUpdates, 25)
      log.debug(`Chuncked assicationkeys into ${chunks.length} parts`)

      for (const chunk of chunks) {
        const params = {
          RequestItems: {
            [await this.config.resolve<string>('eventstore/tables/saga-association') as string]: chunk
          }
        }
        log.debug(`Saving saga event ${saga.sagaId}`)
        await this.db.batchWrite(params).promise()
      }
    } else {
      log.info(`No assocations found`)
    }
    // if (true) {
    // let attributes = lz.compress(Utils.tryStringifyJson(saga.attributes), { outputEncoding: 'BinaryString' })
    let attributes = Utils.tryStringifyJson(saga.attributes || {})

    if (attributes && Buffer.byteLength(attributes, 'utf8') >= MAX_ATTRIBUTES_SIZE) {

      log.debug(`Attributes to big. Storing on s3`)

      await this.s3.putObject({
        Bucket: await this.config.resolve<string>('eventstore/bucket') as string,
        Key: `saga/${saga.sagaId}.json`,
        Body: attributes
      }).promise()

      attributes = undefined
    }
    // }
    const sagaToSave = {
      ...saga,
      attributes,
      _associationKeys: Utils.tryStringifyJson(allAssocationsKeys),
      createdAt: saga.createdAt ? saga.createdAt.toISOString() : undefined,
      updatedAt: saga.updatedAt ? saga.updatedAt.toISOString() : undefined,
      finishedAt: saga.finishedAt ? saga.finishedAt.toISOString() : undefined
    }
    await this.db.put({
      TableName: await this.config.resolve<string>('eventstore/tables/saga') as string,
      Item: sagaToSave
    }).promise()
    this._cache[saga.sagaId] = sagaToSave
    log.debug(`Saga ${saga.sagaId} saved`)
  }

  private mapSaga (saga: SagaState): SagaState {
    let attributes = saga.attributes
    try {
      // attributes = Utils.tryParseJson(lz.decompress(attributes, {inputEncoding : 'BinaryString'}))
    } catch (e) {
      attributes = Utils.tryParseJson(saga.attributes)
      // ignore might be old
    }
    attributes = Utils.tryParseJson(saga.attributes)
    return {
      ...saga as SagaState,
      createdAt: moment(saga.createdAt).toDate(),
      updatedAt: moment(saga.updatedAt).toDate(),
      finishedAt: moment(saga.finishedAt).toDate(),
      attributes: attributes,
      _associationKeys: Utils.tryParseJson(saga._associationKeys)
    }
  }

  private sanitizeAssociationName (assocation: AssociationAttribute) {
    let name
    if (assocation.type) {
      name = `${(assocation.type as any)._association.context}.${(assocation.type as any)._association.aggregateType}.${assocation.type.name}`
    } else if (assocation.external) {
      name = `${assocation.external.context}.${assocation.external.aggregateType}.${assocation.external.name}`
    }
    if (assocation.isGlobal) {
      return `${assocation.sagaType}#${name}`
    }
    return `${assocation.sagaType}#${name}-${assocation.name}#${assocation.value}`
  }

}
