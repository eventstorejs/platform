
import { uniq, isString } from 'lodash'
import { Callback } from 'aws-lambda'
import { Container, ContainerModule } from 'inversify'
import { APP_CONFIG, Utils, Config } from '@eventstorejs/core'
import { Context } from '../definitions'
import { sanitizeRequest, REQUEST_KEYS, REQUEST_NAMSPACE_KEY, isRegistryContainerModule } from '../utils'
import { createNamespace, Namespace } from 'continuation-local-storage'
import { logger } from '../logger'
import { SSMConfig } from '../services'
import * as cuid from 'cuid'

// export const REQUEST = new InjectionToken<any>('Current Request')
// export const CONTEXT = new InjectionToken<Context>('Current Context')

function collectModules (imports: Array<ContainerModule>) {
  let res: Array<any> = []
  for (const i of imports) {
    const imports = isRegistryContainerModule(i) ? i.required : []
    res.push(i)
    if (imports) {
      res = [
        ...res,
        ...collectModules(imports)
      ]
    }
  }
  return res
}

function normalizeRequest (request: any, context: Context) {
  let event: any
  const log = logger('request')
  if (request.invocationType) {
    context.identity = request.identity
    context.invocationType = request.invocationType
    context.correlationId = request.correlationId || cuid()
    log.debug(`Is internal invocation`)
    event = sanitizeRequest(request.body)
  } else if (request.body) {
    log.debug(`Is HTTP Request. Do have a body`)
    log.debug(`Sanitizing just request body`)
    event = request.body
    if (isString(event)) {
      log.debug(`Body is in string. Parsing`)
      event = Utils.tryParseJson(event)
    } else {
      log.debug(`Body is already parsed. Santitze again`)
      event = sanitizeRequest(request.body)
    }
    log.debug(`Request sanitze completed`)
    context.method = request.method
    context.params = request.params
    context.query = request.query
    context.headers = request.headers
    context.correlationId = context.awsRequestId || cuid()
  } else {
    log.debug(`not a http request. just pass the event`)
    log.debug(`Sanitizing request`)
    event = sanitizeRequest(request)
    log.debug(`Request sanitze completed`)
    context.correlationId = request.correlationId || cuid()
  }
  return { event, context }
}

const REQUEST_NAMESPACE: Namespace = createNamespace(REQUEST_NAMSPACE_KEY)

export function makeRequestHandler (handler: any, imports: Array<any> = []) {
  let container: Container
  const log = logger('boostrap')
  const requestHandler = (request: any, context: Context, callback: Callback) => {
    REQUEST_NAMESPACE.run(() => {
      try {
        const normalizedRequest = normalizeRequest(request, context)
        REQUEST_NAMESPACE.set(REQUEST_KEYS.REQUEST, normalizedRequest.event)
        REQUEST_NAMESPACE.set(REQUEST_KEYS.CONTEXT, normalizedRequest.context)
        if (!container) {
          const start = Date.now()
          const APP_MODULES = uniq(collectModules(imports))
          log.debug(`Resolving ${APP_MODULES.length} modules`)
          container = new Container()
          container.load(...APP_MODULES)
          container.bind<any>(APP_CONFIG).toConstantValue(process.env)
          container.bind<Config>(Config).to(SSMConfig).inSingletonScope()
          const bootstrapTime = Date.now() - start
          if (bootstrapTime >= 150) {
            log.warn(`Bootstrapping completed in ${bootstrapTime} milis`)
          } else {
            log.debug(`Bootstrapping completed in ${bootstrapTime} milis`)
          }
        }
        const requestContainer = container.createChild()
        requestContainer.bind('blub').toDynamicValue(() => normalizedRequest.event)
        requestContainer.bind(handler).to(handler)
        const requestHandlerInstance = requestContainer.get<any>(handler)
        requestHandlerInstance._injector = requestContainer
        requestHandlerInstance._handle(normalizedRequest.event, normalizedRequest.context, callback)
          .catch((e: any) => {
            log.error(`Error while handling request`, e)
            callback(e)
          })
      } catch (e) {
        log.error('Could not setup request handler', e)
        callback(e)
      }
    })
  }
  (requestHandler as any).Type = handler
  return requestHandler as any
}

export function makeTestRequestHandler<T> (handler: any, providers: Array<any> = []): T {
  return new (handler as any).Type(...providers)
}
