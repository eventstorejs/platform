import { Container } from 'inversify'
import { Callback } from 'aws-lambda'
import { RequestHandlerDecorator, configureHandler, Context, AbstractRequestHandler, REQUEST_HANDLER_CONFIG_DEFAULTS } from '@eventstorejs/request'
import { AbstractEventHandler, Event, OnEventHandlerDecorator } from '@eventstorejs/eventstore'
import { SagaManager } from '../services'

// import { CqrsContext, ReplayRequest } from '../definitions'

export const SAGA_EVENT_HANDLER_REFLECT_KEYS = {
  SAGA_HANDLER: '__SAGA:HANDLER__'
}

export abstract class AbstractSagaRequestHandler implements AbstractEventHandler {

  abstract readonly _injector: Container

  abstract handle (events: any, context: Context): Promise<any>

  abstract _handle (event: any, context: Context, callback: Callback): Promise<any>

  abstract _hasEventHandlers (event: Event): Array<{ handler: string, meta: OnEventHandlerDecorator }>

  abstract _handleEvent (event: Event, context: Context): Promise<void>

  async handleAll (event: Event, context: Context) {
    const manager = this._injector.get(SagaManager)
    const config = Reflect.getMetadata(SAGA_EVENT_HANDLER_REFLECT_KEYS.SAGA_HANDLER, this) as SagaHandlerDecorator
    let saga = this as any
    if (config && config.sagaType) {
      saga = this._injector.get(config.sagaType)
    }
    await manager.handle(event, context, saga)
  }

}

export interface SagaHandler {
}

export interface SagaHandlerDecorator extends RequestHandlerDecorator {
  sagaType?: any
}

export const SAGA_REQUEST_HANDLER_CONFIG_DEFAULTS: SagaHandlerDecorator = {
  ...REQUEST_HANDLER_CONFIG_DEFAULTS
}

export function sagaHandler (value: RequestHandlerDecorator) {
  return function (target: any) {
    const config = { ...SAGA_REQUEST_HANDLER_CONFIG_DEFAULTS, ...value } as any
    const res = configureHandler(config, target, [AbstractSagaRequestHandler, AbstractEventHandler, AbstractRequestHandler])
    Reflect.defineMetadata(SAGA_EVENT_HANDLER_REFLECT_KEYS.SAGA_HANDLER, config, target.prototype)
    return res
  }
}
