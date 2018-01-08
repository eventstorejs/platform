import * as t from 'io-ts'
import { event } from '@eventstorejs/eventstore'
import { CronTrigger, TimedTrigger } from './trigger.model'

export type Events
  = SetEvent
  | UpdatedEvent
  | CanceledEvent
  | TriggeredEvent

export const SetEvent = event({ name: 'SET', aggregateType: 'trigger', context: 'scheduler' }, t.union([CronTrigger, TimedTrigger]))

export type SetEvent = t.TypeOf<typeof SetEvent>

export const UpdatedEvent = event({ name: 'UPDATED', aggregateType: 'trigger', context: 'scheduler' }, t.interface({

}))

export type UpdatedEvent = t.TypeOf<typeof UpdatedEvent>

export const CanceledEvent = event({ name: 'CANCELED', aggregateType: 'trigger', context: 'scheduler' }, t.interface({

}))

export type CanceledEvent = t.TypeOf<typeof CanceledEvent>

export const TriggeredEvent = event({ name: 'TRIGGERED', aggregateType: 'trigger', context: 'scheduler' }, t.interface({

}))

export type TriggeredEvent = t.TypeOf<typeof TriggeredEvent>

export const TriggerExpired = event({ name: 'EXPIRED', aggregateType: 'trigger', context: 'scheduler' }, t.interface({

}))

export type TriggerExpired = t.TypeOf<typeof TriggerExpired>
