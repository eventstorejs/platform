import { DynamoDB } from 'aws-sdk'
import { injectable, inject } from 'inversify'
import { Config, Utils } from '@eventstorejs/core'
import { DYNAMO_TOKEN } from '@eventstorejs/aws'
import { logger } from '@eventstorejs/request'
import { Event, Snapshot } from '../../definitions'

const log = logger('snapshot')

@injectable()
export class SnapshotStrategy {

  constructor (@inject(Config) private config: Config, @inject(DYNAMO_TOKEN) private db: DynamoDB.DocumentClient) {
  }

  async isSnapshotRequired (events: Array<Event>) {
    if (!events) {
      return false
    }
    return events.length >= 10
  }

  async findOne (aggregateId: string): Promise<Snapshot | undefined> {
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/snapshot') as string,
      ScanIndexForward: true,
      KeyConditionExpression: 'aggregateId = :a',
      Limit: 1,
      ExpressionAttributeValues: {
        ':a': aggregateId
      }
    }

    let res = await this.db.query(params).promise()
    if (!res.Items || res.Items.length === 0) {
      return undefined
      // throw new SnapshotNotFoundError(`Snapshot not found for ${aggregateId}`)
    }
    log.debug(`Snapshot for ${aggregateId} found`)
    return {
      aggregateId,
      aggregateType: res.Items[0].aggregateType,
      context: res.Items[0].context,
      attributes: Utils.tryParseJson(res.Items[0].attributes),
      revision: res.Items[0].revision,
      committedAt: res.Items[0].committedAt
    }
  }

  async storeSnapshot (snapshot: Snapshot): Promise<void> {
    const params = {
      TableName: await this.config.resolve<string>('eventstore/tables/snapshot') as string,
      Item: {
        aggregateId: snapshot.aggregateId,
        aggregateType: snapshot.aggregateType,
        context: snapshot.context,
        revision: snapshot.revision,
        committedAt: snapshot.committedAt.toISOString(),
        attributes: Utils.tryStringifyJson(snapshot.attributes)
      }
    }
    log.info(`Pushing snapshot for ${snapshot.aggregateId} as revision ${snapshot.revision}.`)
    await this.db.put(params).promise()
  }

}
