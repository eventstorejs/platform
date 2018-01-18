
import { ContainerModule } from 'inversify'
import { applyMixins } from '@eventstorejs/core'
import { makeRequestHandler, AbstractRequestHandler } from '../lifecycle'
import { makeInjectable } from '../utils'

export const REQUEST_HANDLER_REFLECT_KEYS = {
  REQUEST_HANDLER: '__REQUEST:HANDLER__'
}

export interface RequestHandlerDecorator {
  name: string
  imports?: Array<ContainerModule>
  timeout?: number
  events?: any
  memory?: number
  include?: Array<string>
  exclude?: Array<string>
}

export const REQUEST_HANDLER_CONFIG_DEFAULTS: RequestHandlerDecorator = {
  name: undefined as any,
  imports: [],
  timeout: 30
}

export function configureHandler (value: RequestHandlerDecorator, target: any, mixins: Array<any>) {
  if (!value.name) {
    throw new Error('Handler name not provided')
  }
  const config = {
    ...REQUEST_HANDLER_CONFIG_DEFAULTS,
    ...value
  }
  applyMixins(target, mixins)
  makeInjectable(target, 'handler')
  Reflect.defineMetadata(REQUEST_HANDLER_REFLECT_KEYS.REQUEST_HANDLER, config, target.prototype)
  return makeRequestHandler(target, value.imports) as any

}

export function handler (value: RequestHandlerDecorator) {
  return function (target: any) {
    return configureHandler(value, target, [AbstractRequestHandler])
  }
}
