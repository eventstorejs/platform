import { Container } from 'inversify'
import { Callback } from 'aws-lambda'
import { logger, RequestHandlerDecorator, configureHandler, Context, AbstractRequestHandler, REQUEST_HANDLER_CONFIG_DEFAULTS } from '@eventstorejs/request'
import { EVENT_HANDLER_REFLECT_KEYS, AbstractEventHandler, Event, OnEventHandlerDecorator } from '@eventstorejs/eventstore'

import { CqrsContext, ReplayRequest } from '../definitions'

export const CQRS_EVENT_HANDLER_REFLECT_KEYS = {
  CQRS_HANDLER: '__CQRS:HANDLER__',
  CQRS_EVENT_HANDLER: '__CQRS_EVENT:HANDLER__'
}

const log = logger('cqrs')

export abstract class AbstractCqrsRequestHandler implements AbstractEventHandler {

  abstract readonly _injector: Container

  abstract handle (events: any, context: Context): Promise<any>

  abstract _handle (event: any, context: Context, callback: Callback): Promise<any>

  abstract _hasEventHandlers (event: Event): Array<{ handler: string, meta: OnEventHandlerDecorator }>

  abstract _handleEvent (event: Event, context: Context): Promise<void>

  async handleAll (event: Event, context: Context) {
    // TODO maybe add caching here
    const handlers = this._hasEventHandlers(event)
      .filter(h => Reflect.getMetadata(CQRS_EVENT_HANDLER_REFLECT_KEYS.CQRS_EVENT_HANDLER, this, h.handler))
    const cqrsContext = {
      ...context,
      isReplay: false
    } as CqrsContext
    log.debug(`Has ${handlers.length} event handler for ${event.name}`)

    for (const handler of handlers) {
      await (this as any)[handler.handler](event, cqrsContext)
    }
  }

  // async _replay (request: ReplayRequest | undefined, context: CqrsContext): Promise<any> {
  //   log.info(`Start Replay handling`)
  //   const replay = this._injector.get(EventReplayService)
  //   context.isReplay = true
  //   let currentPartitionKey = undefined
  //   if (!request || !request.partitionKey) {
  //     log.info(`No PartitionKey. Is Request from the beginning`)
  //     if (this.onReplayStart) {
  //       log.debug(`Execution before callback`)
  //       await this.onReplayStart()
  //     }
  //     log.debug(`Before completed. Getting items`)
  //   } else {
  //     currentPartitionKey = request.partitionKey
  //     log.debug(`Is Continuing replay. Current partitionKey: ${currentPartitionKey}`)
  //   }
  //   let events = (await replay.getPartition<any>(currentPartitionKey) || [])

  //   for (let event of events) {
  //     await this.handle(event, context)
  //   }
  //   log.info(`Event Processing completed`)
  //   if (await replay.hasNextPartition(currentPartitionKey)) {
  //     let nextRequest = {
  //       partitionKey: await replay.nextPartition(currentPartitionKey)
  //     } as ReplayRequest
  //     if (this.onNextChunk) {
  //       await this.onNextChunk(nextRequest)
  //     }
  //     log.info(`Has next Partition. Dispatching for ${nextRequest.partitionKey}`)
  //     await replay.executeNext(context.functionName, nextRequest)
  //     log.info(`Succefully dispatched. Done here`)

  //   } else {
  //     log.info(`No more partitions. Finished!`)
  //   }
  // }

  abstract onReplayStart (): Promise<void>

  abstract onNextChunk (chunk: ReplayRequest): Promise<void>

  abstract onReplayComplete (): Promise<void>

}

export interface CqrsHandler {

}
export interface CqrsReplayHandler extends CqrsHandler {

  onReplayStart? (): Promise<void>

  onNextChunk? (chunk: any): Promise<void>

  onReplayComplete? (): Promise<void>

}

export interface CqrsHandlerDecorator extends RequestHandlerDecorator {
  replayable?: boolean
}

export const CQRS_REQUEST_HANDLER_CONFIG_DEFAULTS: CqrsHandlerDecorator = {
  ...REQUEST_HANDLER_CONFIG_DEFAULTS,
  replayable: true
}

export function cqrsHandler (value: RequestHandlerDecorator) {
  return function (target: any) {
    const config = { ...CQRS_REQUEST_HANDLER_CONFIG_DEFAULTS, ...value } as any
    const res = configureHandler(config, target, [AbstractCqrsRequestHandler, AbstractEventHandler, AbstractRequestHandler])
    Reflect.defineMetadata(CQRS_EVENT_HANDLER_REFLECT_KEYS.CQRS_HANDLER, config, target.prototype)
    return res
  }
}

export interface CqrsEventHandlerDecorator extends OnEventHandlerDecorator {
  // skipReplay?: boolean
}

export function cqrsEventHandler (value: CqrsEventHandlerDecorator) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true
    const method = descriptor.value
    descriptor.value = function (event: Event) {
      return method.call(this, event)
    }
    Reflect.defineMetadata(CQRS_EVENT_HANDLER_REFLECT_KEYS.CQRS_EVENT_HANDLER, value, target, propertyKey)
    Reflect.defineMetadata(EVENT_HANDLER_REFLECT_KEYS.EVENT_HANDLER, value, target, propertyKey)
  }
}
