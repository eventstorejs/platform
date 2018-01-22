import * as t from 'io-ts'
import * as _ from 'lodash'
import { ApiError, optional } from '@eventstorejs/api-builder'
import { EventAssociation, eventNamespaceFactory } from '@eventstorejs/eventstore'
import { ExternalResource } from '@eventstorejs/storage'

export type Events
  = Event.Created
  | Event.Pending
  | Event.CreateFailed

const event = eventNamespaceFactory({
  aggregateType: 'pdf',
  context: 'pdf'
})

export namespace Event {
  export const Created = event('CREATED', t.interface({
    bucket: t.string,
    path: t.string
  }))

  export type Created = t.TypeOf<typeof Created>

  export const Pending = event('PENDING', optional({
    template: t.string
  }, {
    externalResources: t.array(ExternalResource)
  }))

  export type Pending = t.TypeOf<typeof Pending>

  export const CreateFailed = event('CREATE_FAILED', t.interface({
    reason: ApiError
  }))

  export type CreateFailed = t.TypeOf<typeof CreateFailed>
}

// export type Events = keyof Event

// export const Pdf = events({ aggregateType: 'pdf', context: 'pdf' }, {
//   CREATED: t.interface({
//     bucket: t.string,
//     path: t.string
//   })
// })

// export type Pdf = {
//   CREATED: t.TypeOf<typeof Pdf.CREATED>
// }

// export const CreatedEvent = event({ name: 'CREATED', aggregateType: 'pdf', context: 'pdf' }, t.interface({
//   bucket: t.string,
//   path: t.string
// }))

// export type CreatedEvent = t.TypeOf<typeof CreatedEvent>

// export const PendingEvent = event({ name: 'PENDING', aggregateType: 'pdf', context: 'pdf' }, optional({
//   template: t.string
// }, {
//   externalResources: t.array(ExternalResource)
// }))

// export type PendingEvent = t.TypeOf<typeof PendingEvent>

// export const CreateFailedEvent = event({ name: 'CREATE_FAILED', aggregateType: 'pdf', context: 'pdf' }, t.interface({
//   reason: ApiError
// }))

// export type CreateFailedEvent = t.TypeOf<typeof CreateFailedEvent>
