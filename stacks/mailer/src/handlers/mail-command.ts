import '@eventstorejs/request'

import { Context, logger } from '@eventstorejs/request'
import { MailModule, MailService } from '@eventstorejs/mail'
import { commandHandler, CommandRequestHandler, commandEventHandler } from '@eventstorejs/eventstore'
import * as Mail from '../api/mail'
import { MailStackModule, MailAggregateRepository, MailAggregate } from '../lib'

const log = logger('command')

export function wait<T> (millis = 1000, val?: T): Promise<T> {
  return new Promise<T>((resolve) => setTimeout(() => resolve(val), millis))
}

@commandHandler({
  name: 'mailing',
  context: 'mailer',
  imports: [
    MailModule,
    MailStackModule
  ]
})
export default class MailCommandHandler implements CommandRequestHandler {

  constructor(private mail: MailService, private mailRepo: MailAggregateRepository) {

  }

  @commandEventHandler({
    type: Mail.SendCommand
  })
  async handleMailSend (command: Mail.SendCommand, _context: Context) {
    let mail = new MailAggregate()
    mail.apply({
      name: Mail.AddedEvent.name,
      payload: { email: command.payload }
    } as Mail.AddedEvent)
    log.info(`Published. Added Event. Sending mail`)
    await this.mailRepo.commit(mail)
    try {
      await this.mail.send(command.payload)
      log.info(`Mail send. Publishing sended event`)
      mail.apply({
        name: Mail.SendedEvent.name,
        payload: {}
      } as Mail.SendedEvent)
    } catch (e) {
      log.warn(`Mail Send failed.`, e)
      mail.apply({
        name: Mail.SendFailureEvent.name,
        payload: {
          reason: {
            key: 'INTERNAL',
            message: e ? e.toString() : undefined
          }
        }
      } as Mail.SendFailureEvent)
    }
    await this.mailRepo.commit(mail)
    return {
      body: {
        aggregateId: mail.aggregateId
      }
    }
  }

}
