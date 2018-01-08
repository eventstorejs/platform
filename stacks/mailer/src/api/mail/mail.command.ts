import * as t from 'io-ts'
import { command } from '@eventstorejs/eventstore'
import { EMail } from './mail.model'

export type Commands
  = SendCommand
  | ReSendCommand

export const SendCommand = command('mail.SEND', 'mailer', EMail)

export type SendCommand = t.TypeOf<typeof SendCommand>

export const ReSendCommand = command('mail.SEND', 'mailer', t.interface({
}))

export type ReSendCommand = t.TypeOf<typeof ReSendCommand>

  // export const ErrorTypes = registerErrors([
  //   ['INTERNAL']
  // ], CATEGORY)

  // export type ErrorTypes = keyof typeof ErrorTypes
