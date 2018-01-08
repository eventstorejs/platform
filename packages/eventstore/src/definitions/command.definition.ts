import * as t from 'io-ts'
import { optional } from '@eventstorejs/api-builder'

export const Command = optional({
  name: t.string,
  context: t.string
}, {
  aggregateId: t.string,
  meta: t.dictionary(t.string, t.any)
})

export type Command = t.TypeOf<typeof Command>
