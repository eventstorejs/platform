import * as t from 'io-ts'
import { command } from '@eventstorejs/eventstore'
import { optional } from '@eventstorejs/api-builder'
import { ExternalResource } from '@eventstorejs/storage'

export type Commands
  = CreateCommand

const CATEGORY = 'pdf'

export const CreateCommand = command(`${CATEGORY}.CREATE`, 'pdf', optional({
  template: t.string
}, {
  externalResources: t.array(ExternalResource)
}))

export type CreateCommand = t.TypeOf<typeof CreateCommand>
