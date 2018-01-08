import * as t from 'io-ts'
import { isArray, isNumber } from 'lodash'
import { Container } from 'inversify'
import { tryParseJson } from '@eventstorejs/core'
import { logger, RequestHandlerDecorator, configureHandler, Context, AbstractRequestHandler } from '@eventstorejs/request'
import { Event } from '../definitions'
import { isEvent } from '../declarations'
import { Callback } from 'aws-lambda'

export const EVENT_HANDLER_REFLECT_KEYS = {
  EVENT_HANDLER: '__EVENT_REQUEST:HANDLER__',
  REQUEST_HANDLER: '__EVENT:HANDLER__'
}

const log = logger('eventstore.command')

export abstract class AbstractEventHandler implements AbstractRequestHandler {

  abstract readonly _injector: Container

  abstract _handle (event: any, context: Context, callback: Callback): Promise<any>

  abstract handleAll? (event: Event, context: Context): Promise<any>

  async handle (events: any, context: Context): Promise<any> {
    log.debug(`Recieved ${events.Records.length} events from dynamo`)
    for (const record of events.Records) {
      const r = (record.dynamodb as any).NewImage
      if (!r || record.eventName !== 'INSERT') {
        log.warn(`Someone messed with the eventStore...`)
        continue
      }
      const event = {
        committedAt: r.committedAt ? new Date(r.committedAt.S) : undefined,
        aggregateId: r.aggregateId ? r.aggregateId.S as string : undefined,
        context: r.context ? r.context.S as string : undefined,
        name: r.name.S as string,
        revision: r.revision ? (!isNumber(r.revision.N) ? parseInt(r.revision.N, undefined) : r.revision.N as number) : undefined,
        aggregateType: r.aggregateType ? r.aggregateType.S as string : undefined,
        payload: r.payload ? tryParseJson<any>(r.payload.S) : undefined,
        meta: r.meta ? tryParseJson<any>(r.meta.S) : undefined
      } as any
      if (event.meta) {
        context.correlationId = event.meta.correlationId || context.correlationId
        context.identity = event.meta.identity || context.identity
      }

      log.debug(`Start handling of ${event.name} for ${event.aggregateId} of type ${event.aggregateType} with revision ${event.revision}`)
      await this._handleEvent(event, context)
      log.debug(`Handling of ${event.name} completed`)
    }
  }

  async _handleEvent (event: Event, context: Context) {
    // TODO maybe add caching here
    if (this.handleAll) {
      log.debug(`Has handle all handler`)
      return await this.handleAll(event, context)
    }
    const handlers = this._hasEventHandlers(event)
    log.debug(`Has ${handlers.length} event handler for ${event.name}`)
    for (const handler of handlers) {
      await (this as any)[handler.handler](event, context)
    }
  }

  _hasEventHandlers (event: Event): Array<{ handler: string, meta: OnEventHandlerDecorator }> {
    const res = []
    for (const key in this) {
      const meta = Reflect.getMetadata(EVENT_HANDLER_REFLECT_KEYS.EVENT_HANDLER, this, key) as OnEventHandlerDecorator
      if (meta && meta.type) {
        const types = isArray(meta.type) ? meta.type : [meta.type]
        for (const type of types) {
          if (isEvent(event, type)) {
            res.push({ handler: key, meta })
          }
        }
      }
    }
    return res
  }

}

export interface EventHandler {

}

export interface EventHandlerDecorator extends RequestHandlerDecorator {
}

export function eventHandler (value: EventHandlerDecorator) {
  return function (target: any) {
    const config = { ...value } as any
    const res = configureHandler(config, target, [AbstractRequestHandler, AbstractEventHandler])
    Reflect.defineMetadata(EVENT_HANDLER_REFLECT_KEYS.REQUEST_HANDLER, config, target.prototype)
    return res
  }
}

export interface OnEventHandlerDecorator {
  type: t.Type<Event> | Array<t.Type<Event>>
  // noValidate?: boolean
}

export function onEvent (value: OnEventHandlerDecorator) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true
    const method = descriptor.value
    descriptor.value = function (event: Event, context: Context) {
      return method.call(this, event, context)
    }
    Reflect.defineMetadata(EVENT_HANDLER_REFLECT_KEYS.EVENT_HANDLER, value, target, propertyKey)
  }
}
