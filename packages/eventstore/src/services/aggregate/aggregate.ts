import * as t from 'io-ts'
import { badRequest } from 'boom'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
import { PathReporter } from 'io-ts/lib/PathReporter'
import * as cuid from 'cuid'
import { applyMixins, tryStringifyJson } from '@eventstorejs/core'
import { Event } from '../../definitions'

export const AGGREGATE_REFLECT_KEYS = {
  AGGREGATE: '__AGGREGATE__',
  AGGREGATE_REPOSITORY: '__AGGREGATE_REPOSITORY__',
  AGGREGATE_EVENT_HANDLER: '__AGGREGATE_EVENT_HANDLER__'
}

// const log = logger('aggregate')

export abstract class AbstractAggregate {

  public _uncomittedEvents: Array<Event>

  public _commitedEvents: Array<Event>

  public attributes: any

  public aggregateId: string

  apply (event: Event, isRestore: boolean = false): void {
    const handler = this._hasEventHandler(event)
    if (!handler) {
      throw new Error(`Unknown Event ${event.name} applied`)
    }
    if (handler.meta.isCreate) {
      event.aggregateId = event.aggregateId || this.generateAggregateId()
      this.aggregateId = event.aggregateId
    } else {
      event.aggregateId = this.aggregateId
    }
    event.aggregateType = this.getConfig().name
    event.context = this.getConfig().context
    if (!isRestore && !handler.meta.noValidate) {
      const validation = t.validate(event, handler.meta.type)
      try {
        ThrowReporter.report(validation)
      } catch (e) {
        throw badRequest(`Event validation failed`, {
          event,
          validation: tryStringifyJson(PathReporter.report(validation))
        })
      }
    }
    (this as any)[handler.handler](event)
    if (!this._uncomittedEvents) {
      this._uncomittedEvents = []
    }
    this._uncomittedEvents.push(event)
  }

  _hasEventHandler (event: Event): { handler: string, meta: AggregateEventHandlerDecorator } | undefined {
    for (const key in this) {
      const meta = Reflect.getMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE_EVENT_HANDLER, this, key) as AggregateEventHandlerDecorator
      if (meta && meta.type) {
        if (meta.type.name === event.name) {
          return { handler: key, meta }
        }
      }
    }
    return undefined
  }

  generateAggregateId () {
    return cuid().toString()
  }

  getConfig () {
    return Reflect.getMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE, this) as AggregateDecorator
  }

}

export interface Aggregate {

  apply (event: Event): void

}

export interface AggregateDecorator {
  name: string
  context: string
}

export function aggregate (value: AggregateDecorator) {
  return function (target: any) {
    if (!value.name) {
      throw new Error('Aggregate name not provided')
    }
    if (!value.context) {
      throw new Error(`Aggregate context has be provided`)
    }
    const config = {
      ...value
    }
    applyMixins(target, [AbstractAggregate])
    Reflect.defineMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE, config, target.prototype)
  }
}

export interface AggregateEventHandlerDecorator {
  type: t.Type<Event>
  isCreate?: boolean
  noValidate?: boolean
}

export function on (value: AggregateEventHandlerDecorator) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    descriptor.enumerable = true
    descriptor.value = function (event: Event) {
      return method.call(this, event)
    }
    Reflect.defineMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE_EVENT_HANDLER, value, target, propertyKey)
  }
}
