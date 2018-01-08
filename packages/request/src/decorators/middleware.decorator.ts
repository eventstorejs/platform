
import { makeInjectable } from '../utils'

export const MIDDLEWARE_REFLECT_KEYS = {
  HANDLER: '__HANDLER:MIDDLEWARE__'
}

export const MIDDLEWARE_TOKEN = Symbol.for(`Middlewars`)

export interface MiddlewareDecorator {
  priority?: number
}

export function middleware (config: MiddlewareDecorator) {
  return function (target: any) {
    Reflect.defineMetadata(MIDDLEWARE_REFLECT_KEYS.HANDLER, {
      priority: 1000,
      ... config
    } as MiddlewareDecorator, target.prototype)
    return makeInjectable(target, 'middleware')
  }
}

export function getMiddlewareConfig (instance: any): MiddlewareDecorator {
  return (Reflect.getMetadata(MIDDLEWARE_REFLECT_KEYS.HANDLER, instance) as MiddlewareDecorator)
}
