import { injectable, inject } from 'inversify'
import * as moment from 'moment'
import { notFound } from 'boom'
import { Config } from '@eventstorejs/core'
import { StorageService } from '@eventstorejs/storage'
import { logger } from '@eventstorejs/request'
import { CommandResolver, CommandRegistration } from './command.resolver'

const log = logger('commandresolver')

const COMMANDS_PREFIX = 'commands'

// const TIME_TO_LIVE = 1

@injectable()
export class BucketCommandResolver implements CommandResolver {

  private commands: { [context: string]: { [name: string]: CommandRegistration } } = {}

  constructor ( @inject(Config) private config: Config, @inject(StorageService) private storage: StorageService) {

  }

  public async resolve (request: { name: string, context: string }): Promise<CommandRegistration> {
    let command = undefined
    if (this.commands[request.context] && this.commands[request.context][request.name]) {
      command = this.commands[request.context][request.name]
    }
    if (!command || (command.validUntil && moment(command.validUntil).isAfter(moment()))) {
      log.info(`Couldn not resolve command: ${request.name} of ${request.context}. Not found or expired`)
      await this.loadCommands()
      if (this.commands[request.context] && this.commands[request.context][request.name]) {
        command = this.commands[request.context][request.name]
      }
      if (!command) {
        throw notFound(`Command not found`, {
          code: 'CommandNotFound',
          payload: {
            name: request.name,
            context: request.context
          }
        })
      }
    }
    return command

  }

  private async loadCommands () {
    const stage = await this.config.resolve<string>('STAGE')
    const bucket = await this.config.resolve<string>('eventstore/bucket')

    if (!stage || !bucket) {
      throw new Error(`Could not resolve stage or bucket`)
    }

    log.debug(`Resolving commands on bucket ${bucket} with stage ${stage}`)

    const commandList = (await this.storage.readDirectory({
      bucket,
      key: `${COMMANDS_PREFIX}`
    }))
      .map(r => JSON.parse(r.value as string))

    this.commands = {}
    for (const list of commandList) {
      for (const c of list) {
        if (!this.commands[c.context]) {
          this.commands[c.context] = {}
        }
        this.commands[c.context][c.name] = {
          lambdaArn: c.lambdaArn,
          // validUntil: moment().add(TIME_TO_LIVE, 'minutes').toDate(),
          deployedAt: new Date(c.deployedAt) || new Date(),
          name: c.name,
          context: c.context

        }
      }
    }

  }

}
