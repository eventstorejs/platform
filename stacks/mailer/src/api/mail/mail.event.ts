import * as t from 'io-ts'
import { ApiError } from '@eventstorejs/api-builder'
import { event } from '@eventstorejs/eventstore'
import { EMail } from './mail.model'

export type Events
  = SendedEvent
  | ReSendedEvent
  | SendFailureEvent

export const AddedEvent = event({ name: 'ADDED', aggregateType: 'mail', context: 'mailer' }, t.interface({
  email: EMail
}))

export type AddedEvent = t.TypeOf<typeof AddedEvent>

export const SendedEvent = event({ name: 'SENDED', aggregateType: 'mail', context: 'mailer' }, t.interface({

}))

export type SendedEvent = t.TypeOf<typeof SendedEvent>

export const ReSendedEvent = event({ name: 'RE_SENDED', aggregateType: 'mail', context: 'mailer' }, t.interface({

}))

export type ReSendedEvent = t.TypeOf<typeof ReSendedEvent>

export const SendFailureEvent = event({ name: 'SEND_FAILURE', aggregateType: 'mail', context: 'mailer' }, t.interface({
  reason: ApiError
}))

export type SendFailureEvent = t.TypeOf<typeof SendFailureEvent>
