import * as t from 'io-ts'
import { command } from '@eventstorejs/eventstore'
import { optional, enumType } from '@eventstorejs/api-builder'
import { Role } from '@eventstorejs/identity'

export type Commands
  = CreateCommand

export const CATEGORY = 'user'

export const CreateCommand = command(`${CATEGORY}.CREATE`, 'auth', optional({
  username: t.string,
  email: t.string
}, {
  firstName: t.string,
  lastName: t.string,
  password: t.string,
  roles: t.array(enumType<Role>(Role)),
  tenant: t.string
}))

export type CreateCommand = t.TypeOf<typeof CreateCommand>
