import { DynamoDB } from 'aws-sdk'
import { injectable, inject } from 'inversify'
import { isNumber, isUndefined, isNull } from 'lodash'
import { Config, Utils } from '@eventstorejs/core'
import { DYNAMO_TOKEN } from '@eventstorejs/aws'
import { logger } from '@eventstorejs/request'
import { Event, RevisionConflictError, AggregateNotFoundError } from '../definitions'

const log = logger('eventstore')

@injectable()
export class EventStore {

  constructor (
    @inject(Config) private config: Config,
    @inject(DYNAMO_TOKEN) private db: DynamoDB.DocumentClient) {

  }

  public async query (aggregateId: string, revision: number = -1): Promise<Array<Event>> {
    log.info(`Getting events for aggregate ${aggregateId}`)

    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/eventstore') as string,
      ConsistentRead: true,
      ScanIndexForward: true,
      KeyConditionExpression: 'aggregateId = :a and revision > :r',
      ExpressionAttributeValues: {
        ':a': aggregateId,
        ':r': revision
      }
    }

    let items = await this.getAllItems(params)
    if (!items || items.length === 0) {
      throw new AggregateNotFoundError(`Aggregate not found for ${aggregateId}`)
    }
    log.debug(`Aggregate ${aggregateId} with ${items.length} events`)
    return items.map(i => this.mapToEvent(i))
  }

  public async find (aggregateType: string): Promise<Array<Event>> {
    log.info(`Getting all aggregates for type ${aggregateType}`)
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/eventstore') as string,
      IndexName: await this.config.resolve<string>('TABLES_EVENT_INDEX_AGGREGATE_TYPE') as string,
      ScanIndexForward: false,
      KeyConditionExpression: 'aggregateType = :type',
      ExpressionAttributeValues: {
        ':type': aggregateType
      }
    }

    let items = (await this.getAllItems(params) || [])
    return items.map(i => this.mapToEvent(i))
  }

  public async partition<E extends Event> (partition: string): Promise<Array<E>> {
    log.info(`Getting all events in partition ${partition}`)
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/eventstore') as string,
      IndexName: await this.config.resolve<string>('TABLES_EVENT_INDEX_PARTITION') as string,
      ScanIndexForward: true,
      KeyConditionExpression: 'partitionKey = :partition',
      ExpressionAttributeValues: {
        ':partition': partition
      }
    }

    let items = (await this.getAllItems(params) || [])
    return items.map(i => this.mapToEvent<E>(i))
  }

  public async lastEvent (aggregateId: string): Promise<Event> {
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/eventstore') as string,
      ConsistentRead: true,
      KeyConditionExpression: 'aggregateId = :a',
      ScanIndexForward: false,
      Limit: 1,
      ExpressionAttributeValues: {
        ':a': aggregateId
      }
    }
    let items = (await this.getAllItems(params) || [])
    if (items.length === 0) {
      throw new AggregateNotFoundError(`No Events found for ${aggregateId}`)
    }
    return this.mapToEvent(items[0])
  }

  public async put (event: Event): Promise<Event> {
    if (!event.aggregateType) {
      throw new Error('aggregateType has to be defined')
    }
    let revision = event.revision
    // TODO this should never hapen again
    if (isUndefined(revision) || isNull(revision)) {
      log.debug(`Revision not set for event. Try resolving`)
      try {
        let lastEvent = await this.lastEvent((event as any).aggregateId)
        if (!lastEvent) {
          // throw
        }
        revision = isNumber(lastEvent.revision) ? lastEvent.revision + 1 : 0
        log.debug(`Last Event found with revision ${lastEvent.revision}. Emitting as ${revision}`)
      } catch (e) {
        log.debug(`No last Event found. Falling back to 0`, e)
        revision = 0
      }
    }
    event.committedAt = new Date()
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/eventstore') as string,
      Item: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        context: event.context,
        revision,
        committedAt: event.committedAt.toISOString(),
        name: event.name,
        payload: Utils.tryStringifyJson((event as any).payload),
        meta: Utils.tryStringifyJson(event.meta)
      },
      ConditionExpression: 'attribute_not_exists(aggregateId) and attribute_not_exists(revision)'
    }
    log.info(`Pushing new event ${event.name} for ${params.Item.aggregateId} as revision ${revision}. Is new: ${event.aggregateId ? 'no' : 'yes'}`)
    try {
      await this.db.put(params).promise()
      log.info(`Event ${event.name} published`)
      return {
        ...params.Item,
        payload: (event as any).payload,
        meta: event.meta,
        committedAt: new Date(params.Item.committedAt)
      } as any
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        log.warn(`ConditonalCheck failed. Revision ${params.Item.revision} already exists`)
        throw new RevisionConflictError(`Revision $${params.Item.revision} already exists`)
      }
      log.error(`Internal Error whiler publishing event`, err)
      throw err
    }
  }

  public async putBatch (events: Array<Event>) {
    // TODO: rewrite using dynamod db batch
    for (let e of events) {
      await this.put(e)
    }
  }

  protected async getAllItems (params: any): Promise<Array<any>> {
    let res = await this.db.query(params).promise()
    if (res.LastEvaluatedKey) {
      let nextParams = {
        ...params,
        ExclusiveStartKey: res.LastEvaluatedKey
      }
      return [...(res.Items || []), ...(await this.getAllItems(nextParams))]
    }
    return [...(res.Items || [])]
  }

  private mapToEvent<E extends Event> (item: any): E {
    return {
      ...item,
      committedAt: new Date(item.committedAt),
      payload: item.payload ? Utils.parseJson(item.payload) : undefined,
      meta: item.meta ? Utils.parseJson(item.meta) : undefined
    } as E
  }

}
