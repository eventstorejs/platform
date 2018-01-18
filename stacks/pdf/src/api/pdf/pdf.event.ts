import * as t from 'io-ts'
import { ApiError, optional } from '@eventstorejs/api-builder'
import { event } from '@eventstorejs/eventstore'
import { ExternalResource } from '@eventstorejs/storage'

export type Events
  = CreatedEvent
  | PendingEvent
  | CreateFailedEvent

export const CreatedEvent = event({ name: 'CREATED', aggregateType: 'pdf', context: 'pdf' }, t.interface({
  bucket: t.string,
  path: t.string
}))

export type CreatedEvent = t.TypeOf<typeof CreatedEvent>

export const PendingEvent = event({ name: 'PENDING', aggregateType: 'pdf', context: 'pdf' }, optional({
  template: t.string
}, {
  externalResources: t.array(ExternalResource)
}))

export type PendingEvent = t.TypeOf<typeof PendingEvent>

export const CreateFailedEvent = event({ name: 'CREATE_FAILED', aggregateType: 'pdf', context: 'pdf' }, t.interface({
  reason: ApiError
}))

export type CreateFailedEvent = t.TypeOf<typeof CreateFailedEvent>
