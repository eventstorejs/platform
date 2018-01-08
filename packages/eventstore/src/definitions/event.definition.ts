import * as t from 'io-ts'
import { DateType, optional } from '@eventstorejs/api-builder'

export const Event = optional({
  name: t.string
}, {
  aggregateId: t.string,
  committedAt: DateType,
  aggregateType: t.string,
  context: t.string,
  revision: t.number,
  meta: t.dictionary(t.string, t.any)
})

export type Event = t.TypeOf<typeof Event>
