// import { injectable, inject, InjectionToken } from 'inversify'
// import * as t from 'io-ts'
// import { LogFactory, Config } from '@eventstorejs/core'
// import { CommandNotFoundError } from './command.errors'

// import { CommandRegistration, RegisteredCommands, Command } from '@api'

// const log = logger('command.CommandResolver')

// export const COMMANDS = new InjectionToken('COMMANDS')

// // Depracated

// @injectable()
// export class CommandResolver {

//   private _commands: { [name: string]: CommandRegistration } = {}

//   constructor ( _config: Config, @inject(COMMANDS) commands: RegisteredCommands) {
//     for (let key in commands) {
//       let c = commands[key]
//       this.register(c.name, c.handler, c.type)
//     }
//   }

//   public async resolve (name: string): Promise<CommandRegistration> {
//     log.debug(`Try resolving ${name} to command Handler`)
//     if (!this._commands[name]) {
//       // log.info(`Command ${name} not found. try resolving new list`)
//       // await this.resolveCommands()
//       // if (!this._commands[name]) {
//       //   log.info(`Command ${name} still not found...`)
//       //   throw new CommandNotFoundError(`Could not find command "${name}"`)
//       // }
//       log.warn(`Command ${name} not found...`)
//       throw new CommandNotFoundError(`Could not find command "${name}"`)
//     }
//     return Promise.resolve(this._commands[name])
//   }

//   public register (name: string, handler: string, type: t.Type<Command>) {
//     log.debug(`Registering command ${name} to handler ${handler}`)
//     if (this._commands[name]) {
//       throw new Error(`Command ${name} already registered`)
//     }
//     this._commands[name] = {
//       name,
//       handler,
//       type
//     }
//   }

//   // private async resolveCommands (): Promise<void> {
//   //   log.info('Resolving commands')
//   //   this._commands = {}
//   //   let res = await this._exec.list()
//   //   log.info(`Resolved ${res.length} commands`)
//   //   for (let c of res) {
//   //     this.register(
//   //       await this.normalizeCommandName(c.name),
//   //       await this.normalizeCommandHandler(c.name)
//   //     )
//   //   }
//   // }

//   // private async normalizeCommandName (name: string): Promise<string> {
//   //   return (await this._exec.normalizeLambdaName(name)).split('-').join('.')
//   // }

//   // private async normalizeCommandHandler (name: string): Promise<string> {
//   //   return await this._exec.normalizeLambdaName(name)
//   // }

// }
