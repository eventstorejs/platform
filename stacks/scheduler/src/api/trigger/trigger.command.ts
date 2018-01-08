import * as t from 'io-ts'
import { command } from '@eventstorejs/eventstore'
import { CronTrigger, TimedTrigger } from './trigger.model'

export type Commands
  = SetCommand
  | UpdateCommand
  | CancelCommand

export const CATEGORY = 'trigger'

export const SetCommand = command(`${CATEGORY}.SET`, 'scheduler', t.union([CronTrigger, TimedTrigger]))

export type SetCommand = t.TypeOf<typeof SetCommand>

export const UpdateCommand = command(`${CATEGORY}.UPDATE`, 'scheduler', t.interface({}))

export type UpdateCommand = t.TypeOf<typeof UpdateCommand>

export const CancelCommand = command(`${CATEGORY}.CANCEL`, 'scheduler', t.interface({

}))

export type CancelCommand = t.TypeOf<typeof CancelCommand>

  // export const ErrorTypes = registerErrors([
  //   ['INTERNAL']
  // ], CATEGORY)

  // export type ErrorTypes = keyof typeof ErrorTypes
