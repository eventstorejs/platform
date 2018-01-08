import * as t from 'io-ts'
import { optional } from '@eventstorejs/api-builder'

export const ExternalResource = optional({
  bucket: t.string,
  path: t.string,
  saveAs: t.string
}, {
  encoding: t.union([t.literal('base64')])
})

export type ExternalResource = t.TypeOf<typeof ExternalResource>
