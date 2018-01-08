import { injectable, inject } from 'inversify'
import { badRequest } from 'boom'
import { logger, Identity, InvocationType, CONTEXT } from '@eventstorejs/request'
import { Config } from '@eventstorejs/core'
import { ExecutionService, ExecutionResult } from '@eventstorejs/execution'
import { Command } from '../definitions'
import { CommandResolver } from './resolver'

const log = logger('command.CommandService')

@injectable()
export class CommandService {

  @inject('blub')
  private currentContext: any

  constructor (
    @inject(Config) private config: Config,
    @inject(CommandResolver) private resolver: CommandResolver,
    @inject(ExecutionService) private exec: ExecutionService) {
  }

  public async handle<T> (command: Command, identity?: Identity): Promise<ExecutionResult<T>> {
    if (!command || !command.name) {
      throw badRequest(`Command name not provided`)
    }
    log.debug(`Handling command ${command.name}`)
    const handler = await this.resolver.resolve({ name: command.name, context: command.context })
    log.debug(`Resolved command handler on aggregate ${handler.lambdaArn}`)
    const context = CONTEXT()
    console.log(context, this.currentContext)
    const res = await this.exec.invoke<T>({
      lambdaArn: handler.lambdaArn,
      payload: {
        invocationType: InvocationType.SYNC,
        body: command,
        identity,
        correlationId: context ? context.correlationId : undefined
      }
    })
    log.debug(`Successfully handled ${command.name}`)
    return res
  }

  public async dispatch (command: Command, identity?: Identity): Promise<void> {
    if (!command || !command.name) {
      throw badRequest(`Command name not provided`)
    }
    log.debug(`Dispatching command ${command.name}`)
    // let handler = await this._resolver.resolve(command.name)
    // log.debug(`Dispatching command ${Utils.tryStringifyJson(command)}`)
    const commandBus = await this.config.resolve<string>('eventstore/command-bus/arn')
    const context = CONTEXT()
    await this.exec.dispatch({
      topicArn: commandBus,
      payload: {
        invocationType: InvocationType.ASYNC,
        body: command,
        identity,
        correlationId: context ? context.correlationId : undefined
      }
    })
    log.debug(`Successfully dispatched ${command.name}`)

  }

}
