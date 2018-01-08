import * as t from 'io-ts'
import { optional } from '@eventstorejs/api-builder'

export const EMailAttachment = optional({
  name: t.string,
  contentType: t.union([t.undefined, t.string])
}, {
  inline: t.string,
  bucket: t.interface({
    name: t.string,
    key: t.string
  })
})

export type EMailAttachment = t.TypeOf<typeof EMailAttachment>

export const EMail = optional({
  from: t.union([t.string, t.interface({
    name: t.string,
    mail: t.string
  })]),
  to: t.string,
  subject: t.string
}, {
  text: t.string,
  html: t.string,
  attachments: t.array(EMailAttachment)
})

export type EMail = t.TypeOf<typeof EMail>
