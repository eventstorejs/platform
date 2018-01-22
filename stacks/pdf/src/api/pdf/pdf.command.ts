import * as t from 'io-ts'
import { commandNamespaceFactory } from '@eventstorejs/eventstore'
import { optional } from '@eventstorejs/api-builder'
import { ExternalResource } from '@eventstorejs/storage'

export type Commands
  = Command.Create


const command = commandNamespaceFactory({
  context: 'pdf',
  category: 'pdf'
})

export namespace Command {
  export const Create = command('CREATE', optional({
    template: t.string
  }, {
    externalResources: t.array(ExternalResource)
  }))

  export type Create = t.TypeOf<typeof Create>
}

// const CATEGORY = 'pdf'

// export const CreateCommand = command(`${CATEGORY}.CREATE`, 'pdf', optional({
//   template: t.string
// }, {
//   externalResources: t.array(ExternalResource)
// }))

// export type CreateCommand = t.TypeOf<typeof CreateCommand>
