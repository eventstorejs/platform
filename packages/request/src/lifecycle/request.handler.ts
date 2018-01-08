import { Container } from 'inversify'
import { BoomError, create } from 'boom'
import { Context } from '../definitions'
import { MIDDLEWARE_TOKEN, getMiddlewareConfig } from '../decorators'
import { logger } from '../logger'
import { Middleware } from '../lifecycle'

const log = logger('request')

export abstract class AbstractRequestHandler {

  abstract readonly _injector: Container

  async _handle (event: any, context: Context, callback: Function) {
    context.callbackWaitsForEmptyEventLoop = false
    let middlewares: Array<Middleware> = []
    try {
      middlewares = this._injector.getAll<Middleware>(MIDDLEWARE_TOKEN)
    } catch (e) {
      log.debug(`No middlewares found`)
    }
    middlewares = middlewares
      .sort((a, b) => getMiddlewareConfig(a).priority || 1000 - (getMiddlewareConfig(b).priority || 1000))
    try {
      for (const middleware of middlewares) {
        if (middleware.preRequest) {
          await middleware.preRequest(event, context)
        }
      }
      log.debug(`Start request handling for ${this.constructor.name}`)
      const r = await this.handle(event, context)
      log.debug(`Request succeded. Running post middleware`)
      for (const middleware of middlewares) {
        if (middleware.postRequest) {
          await middleware.postRequest(r, event, context)
        }
      }
      log.debug(`All done running callback. StatusCode: ${r && r.statusCode ? r.statusCode : 'NONE'}`)
      callback(undefined, r)
    } catch (e) {
      let errorResponse: BoomError = e
      if (!e.isBoom) {
        log.info(`Not boom error. Most likley an uncaught error`)
        log.warn(e.stack)
        errorResponse = create(e.statusCode || 500, e.message)
      }
      for (const middleware of middlewares) {
        if (middleware.failedRequest) {
          await middleware.failedRequest(e, event, context)
        }
      }
      if (errorResponse.isServer) {
        log.error(`Internal Server Error`, errorResponse)
      }
      callback(JSON.stringify({
        ...errorResponse.output,
        ... {
          correlationId: context.correlationId,
          data: e.data
        }
      }))
    }

  }

  abstract handle (event: any, context: Context): Promise<any>

}

export interface RequestHandler<E> {

  handle (event: E, context: Context): Promise<void | { statusCode: number, body?: string }>

}
