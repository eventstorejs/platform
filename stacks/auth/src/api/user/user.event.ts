import * as t from 'io-ts'
import { optional } from '@eventstorejs/api-builder'
import { event } from '@eventstorejs/eventstore'
import { enumType } from '@eventstorejs/api-builder'
import { Role } from '@eventstorejs/identity'

export type Events
  = CreatedEvent

export const CreatedEvent = event({ name: 'CREATED', aggregateType: 'user', context: 'auth' }, optional({
  username: t.string,
  email: t.string,
  tenant: t.string
}, {
  roles: t.array(enumType<Role>(Role)),
  firstName: t.string,
  lastName: t.string,
}))

export type CreatedEvent = t.TypeOf<typeof CreatedEvent>
