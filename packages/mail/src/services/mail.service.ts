import { injectable, inject } from 'inversify'
import { isString } from 'lodash'
import { Config } from '@eventstorejs/core'
import { logger } from '@eventstorejs/request'
import { EMail } from '../definitions'
// import { Readable } from 'stream'
import { MailgunProvider } from '../utils'
import { StorageService } from '@eventstorejs/storage'
// import { FileReadRequest } from '@api'
// const MailgunAttachment = require('mailgun-js').Attachment

const log = logger('mail')

@injectable()
export class MailService {

  constructor(
    @inject(Config) _config: Config,
    @inject(StorageService) private _storage: StorageService,
    @inject(MailgunProvider) private mailgunProvider: MailgunProvider) {

  }

  async send (mail: EMail): Promise<any> {
    const client = await this.mailgunProvider()
    const data = {
      from: isString(mail.from) ? mail.from : `${(mail.from as any).name} <${(mail.from as any).mail}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachment: undefined as Array<any> | undefined
    }
    if (mail.attachments) {
      data.attachment = []
      for (const a of mail.attachments) {
        log.debug(`Mapping Attachment`)
        let att
        if (a.inline) {
          log.debug(`Is inline Attachment. Adding it as stream`)
          att = new client.Attachment({ data: Buffer.from(a.inline), contentType: a.contentType, filename: a.name })
        } else if (a.bucket) {
          log.debug(`Is s3 Attachment. Getting it from ${a.bucket.name} with key ${a.bucket.key}`)
          att = new client.Attachment({
            data: Buffer.from((await this._storage.read({ bucket: a.bucket.name, key: a.bucket.key })) as string),
            contentType: a.contentType,
            filename: a.name
          })
        } else {
          throw new Error(`Invalid Attachment`)
        }
        data.attachment.push(att)
      }
    }

    log.info(`Sending mail to ${data.to} with subject ${data.subject}`)
    log.debug(`Resolved mailgun client`)
    return await client.messages().send(data)
  }

}
