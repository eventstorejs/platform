import * as t from 'io-ts'
import { event } from '@eventstorejs/eventstore'

export type Events
  = CreatedEvent
  | AddedFeatureEvent
  | RemovedFeatureEvent

export const CreatedEvent = event({ name: 'CREATED', aggregateType: 'tenant', context: 'auth' }, t.interface({
  name: t.string
}))

export type CreatedEvent = t.TypeOf<typeof CreatedEvent>

export const AddedFeatureEvent = event({ name: 'FEATURE_ADDED', aggregateType: 'tenant', context: 'auth' }, t.interface({
  feature: t.string
}))

export type AddedFeatureEvent = t.TypeOf<typeof AddedFeatureEvent>

export const RemovedFeatureEvent = event({ name: 'FEATURE_REMOVED', aggregateType: 'tenant', context: 'auth' }, t.interface({
  feature: t.string
}))

export type RemovedFeatureEvent = t.TypeOf<typeof RemovedFeatureEvent>
