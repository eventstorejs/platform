import { injectable, inject } from 'inversify'
import { DYNAMO_TOKEN } from '@eventstorejs/aws'
import { logger } from '@eventstorejs/request'
import { Config } from '@eventstorejs/core'
import * as t from 'io-ts'
import { chunk } from 'lodash'
import * as moment from 'moment-timezone'
import { DynamoDB } from 'aws-sdk'

import { TimedTrigger, CronTrigger } from '../../api'

const log = logger('scheduler')

const parser = require('cron-parser')

export interface NextTriggerOptions {
  nextTrigger: Date
  triggerId: string
}

export interface SetTriggerOptions {
  trigger: TimedTrigger | CronTrigger,
  triggerId: string
}

@injectable()
export class SchedulerService {

  constructor (@inject(Config) private config: Config, @inject(DYNAMO_TOKEN) private dynamo: DynamoDB.DocumentClient) {

  }

  public async setTrigger (options: SetTriggerOptions) {
    let nextTrigger: Date
    if (t.is(options.trigger, CronTrigger)) {
      nextTrigger = this.getNextTrigger(options.trigger) as Date
      if (!nextTrigger) {
        log.warn(`lastExecution is in the past`)
        throw new Error(`LastExecution is in the past`)
      }
    } else if (t.is(options.trigger, TimedTrigger)) {
      nextTrigger = options.trigger.date
    } else {
      throw new Error(`Invalid trigger. Either cron expression or date has to be specified`)
    }
    await this.dynamo.put({
      TableName: await this.config.resolve<string>('TRIGGER_TABLE') as string,
      Item: {
        triggerId: options.triggerId,
        nextTrigger: nextTrigger.getTime()
      }
    }).promise()
  }

  public async cancelTrigger (triggerId: string) {
    await this.dynamo.delete({
      TableName: await this.config.resolve<string>('TRIGGER_TABLE') as string,
      Key: {
        triggerId
      }
    }).promise()
  }

  public async getTriggersToEmit (): Promise<Array<NextTriggerOptions>> {
    let items = await this.dynamo.scan({
      TableName: await this.config.resolve<string>('TRIGGER_TABLE') as string,
      ExpressionAttributeNames: {
        '#nextTrigger': 'nextTrigger'
      },
      ExpressionAttributeValues: {
        ':max': Date.now()
      },
      FilterExpression: '#nextTrigger < :max'
    }).promise()
    if (!items.Items) {
      return []
    }
    return items.Items.map(i => ({
      triggerId: i.triggerId,
      nextTrigger: new Date(i.nextTrigger)
    } as NextTriggerOptions))
  }

  public async updateNextTriggers (triggers: Array<SetTriggerOptions>) {
    let triggersToDelete = []
    let triggersToUpdate = []
    for (let trigger of triggers) {
      if (t.is(trigger.trigger, TimedTrigger)) {
        triggersToDelete.push(trigger.triggerId)
      } else {
        let nextTrigger = this.getNextTrigger(trigger.trigger)
        if (!nextTrigger) {
          triggersToDelete.push(trigger.triggerId)
        } else {
          triggersToUpdate.push({
            triggerId: trigger.triggerId,
            nextTrigger: nextTrigger.getTime()
          })
        }
      }
    }
    let triggerUpdates = [
      ...triggersToUpdate.map(a => ({ PutRequest: { Item: a } })),
      ...triggersToDelete.map(a => ({ DeleteRequest: { Key: { triggerId: a } } }))
    ]
    let chunks = chunk(triggerUpdates, 25)
    log.debug(`Chuncked assicationkeys into ${chunks.length} parts`)

    for (let chunk of chunks) {
      const params = {
        RequestItems: {
          [await this.config.resolve<string>('TRIGGER_TABLE') as string]: chunk
        }
      }
      await this.dynamo.batchWrite(params).promise()
    }
    return {
      deleted: triggersToDelete,
      updated: triggersToUpdate
    }
  }

  public getNextTrigger (trigger: CronTrigger): Date | undefined {
    if (trigger.lastExecution && moment(trigger.lastExecution).isSameOrBefore(moment())) {
      return undefined
    }
    let interval = parser.parseExpression(trigger.cron, {
      currentDate: new Date(),
      endDate: trigger.lastExecution,
      iterator: true
    }) as Iterator<any>
    let nextTrigger = interval.next()
    return nextTrigger.value.toDate()
  }
}
