
import { Container } from 'inversify'
import * as t from 'io-ts'
import { badRequest } from 'boom'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { parseJson, tryStringifyJson } from '@eventstorejs/core'
import { SNSEvent, Callback } from 'aws-lambda'
import { logger, RequestHandlerDecorator, configureHandler, Context, AbstractRequestHandler, InvocationType, Identity } from '@eventstorejs/request'
import { Command } from '../definitions'

export const COMMAND_EVENT_HANDLER_REFLECT_KEYS = {
  REQUEST_HANDLER: '__COMMAND_REQUEST:HANDLER__',
  COMMAND_HANDLER: '__COMMAND_EVENT:HANDLER__'
}

const log = logger('eventstore.command')

export abstract class AbstractCommandRequestHandler implements AbstractRequestHandler {

  abstract readonly _injector: Container

  abstract _handle (event: any, context: Context, callback: Callback): Promise<any>

  async handle (event: any, context: Context): Promise<any> {
    if ((event as SNSEvent).Records) {
      let records = (event as SNSEvent).Records
      log.debug(`Command is dispatched from SNS. Contains ${records.length} records`)
      for (let r of records) {
        if (r.EventSource === 'aws:sns') {
          let c = parseJson(r.Sns.Message) as { body: Command, identity?: Identity, invocationType?: InvocationType, correlationId?: string }
          log.debug(`Command name is ${c.body.name}`)
          context.identity = c.identity
          context.invocationType = c.invocationType || InvocationType.ASYNC
          context.correlationId = c.correlationId
          await this._handleCommand(c.body, context)
        } else {
          log.error(`Unknown eventsource ${r.EventSource}`)
        }
      }
      return undefined
    } else {
      log.debug(`Command is dispatched from command handler`)
      if (!this._hasEventHandler(event as Command)) {
        throw badRequest(`Could not find handler`, {
          name: (event as Command).name,
          context: (event as Command).context
        })
        // throw new BadRequestError(`Could not find handler for command ${(event as Command).name} of ${(event as Command).context}`)
      }
      return await this._handleCommand(event as Command, context)
    }
  }

  async _handleCommand (command: Command, context: Context) {
    // TODO maybe add caching here
    let handler = this._hasEventHandler(command)
    if (handler) {
      log.debug(`Has command handler for ${command.name} with ${handler.handler}`)
      return (this as any)[handler.handler](command, context)
    } else {
      log.debug(`No command handler found for ${command.name}`)
    }
  }

  _hasEventHandler (command: Command): { handler: string, meta: CommandEventHandlerDecorator } | undefined {
    let handler = Reflect.getMetadata(COMMAND_EVENT_HANDLER_REFLECT_KEYS.REQUEST_HANDLER, this) as CommandRequestHandlerDecorator
    for (let key in this) {
      const meta = Reflect.getMetadata(COMMAND_EVENT_HANDLER_REFLECT_KEYS.COMMAND_HANDLER, this, key) as CommandEventHandlerDecorator
      if (meta) {
        const context = meta.context || handler.context
        const name = meta.name || meta.type.name
        if (name === command.name && context === command.context) {
          return { handler: key, meta }
        }
      }
    }
    return undefined
  }

}

export interface CommandRequestHandler {

}

export interface CommandRequestHandlerDecorator extends RequestHandlerDecorator {
  context?: string
}

export const COMMAND_REQUEST_HANDLER_CONFIG_DEFAULTS: CommandRequestHandlerDecorator = {
  name: undefined as any,
  imports: [],
  timeout: 30
}

export function commandHandler (value: CommandRequestHandlerDecorator) {
  return function (target: any) {
    const config = { ...COMMAND_REQUEST_HANDLER_CONFIG_DEFAULTS, ...value } as any
    const res = configureHandler(config, target, [AbstractCommandRequestHandler, AbstractRequestHandler])
    Reflect.defineMetadata(COMMAND_EVENT_HANDLER_REFLECT_KEYS.REQUEST_HANDLER, config, target.prototype)
    return res
  }
}

export interface CommandEventHandlerDecorator {
  type: t.Type<Command>
  name?: string
  context?: string
  noValidate?: boolean
}

export function commandEventHandler (value: CommandEventHandlerDecorator) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true
    let method = descriptor.value
    descriptor.value = function (command: Command, context: Context) {
      // TOOD maybe a middleware symstem for commands
      if (!value.noValidate) {
        const validation = t.validate(command, value.type)
        try {
          ThrowReporter.report(validation)
        } catch (e) {
          log.info(`Command validation failed. Cancel execution`)
          log.info(tryStringifyJson(PathReporter.report(validation)) || 'Could not parse command validation')
          throw badRequest(`Command validation failed`, {
            validation: tryStringifyJson(PathReporter.report(validation))
          })
        }
      }
      return method.call(this, command, context)
    }
    Reflect.defineMetadata(COMMAND_EVENT_HANDLER_REFLECT_KEYS.COMMAND_HANDLER, value, target, propertyKey)
  }
}
