import { aggregate, Aggregate, on } from '@eventstorejs/eventstore'
import * as Trigger from '../../api/trigger'

export interface TriggerAggregateAttributes {
  trigger?: Trigger.CronTrigger | Trigger.TimedTrigger
  lastTrigger?: Date
  expiredAt?: Date
  canceled?: boolean
}

@aggregate({
  name: 'trigger',
  context: 'scheduler'
})
export class TriggerAggregate implements Aggregate {

  public aggregateId: string

  public attributes: TriggerAggregateAttributes = {}

  apply: (event: Trigger.Events) => void

  @on({ type: Trigger.SetEvent, isCreate: true })
  public onTriggerSet (event: Trigger.SetEvent) {
    this.attributes = {
      trigger: event.payload,
      canceled: false
    }
  }

  @on({ type: Trigger.TriggeredEvent })
  public onTriggered (event: Trigger.TriggeredEvent) {
    this.attributes = {
      ... this.attributes,
      lastTrigger: event.committedAt
    }
  }

  @on({ type: Trigger.TriggerExpired })
  public onTriggerExpired (event: Trigger.TriggerExpired) {
    this.attributes = {
      ... this.attributes,
      expiredAt: event.committedAt
    }
  }

  @on({ type: Trigger.CanceledEvent })
  public onTriggerCanceled (_event: Trigger.CanceledEvent) {
    this.attributes = {
      ... this.attributes,
      canceled: true
    }
  }

}
