import { interfaces } from 'inversify'
import { Config } from '@eventstorejs/core'
import { logger } from '@eventstorejs/request'
const mailgun = require('mailgun-js')

const log = logger('mail')

export const MailgunProvider = Symbol.for('MailgunProvider')

export type MailgunProvider = () => Promise<any>

export function MailgunProviderFactory (context: interfaces.Context) {
  const config = context.container.get<Config>(Config)
  return async () => {
    log.debug(`Resolving mailgun client`)
    return mailgun({
      apiKey: await config.resolve('mailer/mailgun/api'),
      domain: await config.resolve('mailer/mailgun/domain')
    })
  }
}
