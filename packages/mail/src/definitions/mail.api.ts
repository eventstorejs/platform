// import * as t from 'io-ts'
// // import { Command, Event, command, event, ApiError, DateType, registerErrors } from '../core'
// import { EMail } from './mail.model'

// export namespace Mail {

//   export const CATEGORY = 'mail'

//   export type Commands
//     = SendCommand

//   export const SendCommand = command(CATEGORY, 'SEND', 'mail-command', t.intersection([Command, t.interface({
//     payload: EMail
//   })]))

//   export type SendCommand = t.TypeOf<typeof SendCommand>

//   export const ReSendCommand = command(CATEGORY, 'RE_SEND', 'mail-command', t.intersection([Command, t.interface({
//     payload: t.interface({

//     })
//   })]))

//   export type ReSendCommand = t.TypeOf<typeof ReSendCommand>

//   export type Events
//     = AddedEvent
//     | InProgressEvent
//     | SendedEvent
//     | SendFailureEvent

//   export const AddedEvent = event(CATEGORY, 'CREATED', t.intersection([Event, t.interface({
//     payload: EMail
//   })]))

//   export type AddedEvent = t.TypeOf<typeof AddedEvent>

//   export const ReAddedEvent = event(CATEGORY, 'RE_ADDED', t.intersection([Event, t.interface({
//     payload: t.interface({
//       readdedAt: DateType
//     })
//   })]))

//   export type ReAddedEvent = t.TypeOf<typeof ReAddedEvent>

//   export const InProgressEvent = event(CATEGORY, 'IN_PROGRESS', t.intersection([Event, t.interface({
//     payload: t.interface({
//       startedAt: DateType
//     })
//   })]))

//   export type InProgressEvent = t.TypeOf<typeof InProgressEvent>

//   export const SendedEvent = event(CATEGORY, 'SENDED', t.intersection([Event, t.interface({
//     payload: t.interface({
//       sendedAt: DateType
//     })
//   })]))

//   export type SendedEvent = t.TypeOf<typeof SendedEvent>

//   export const SendFailureEvent = event(CATEGORY, 'SEND_FAILURE', t.intersection([Event, t.interface({
//     payload: t.interface({
//       reason: ApiError
//     })
//   })]))

//   export type SendFailureEvent = t.TypeOf<typeof SendFailureEvent>

//   export const ErrorTypes = registerErrors([
//     ['INTERNAL']
//   ], CATEGORY)

//   export type ErrorTypes = keyof typeof ErrorTypes

// }
