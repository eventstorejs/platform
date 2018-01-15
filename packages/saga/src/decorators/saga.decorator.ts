import * as t from 'io-ts'
import { applyMixins } from '@eventstorejs/core'
import { Event, isEvent } from '@eventstorejs/eventstore'
import { SagaState } from '../definitions'
import { Context } from '@eventstorejs/request'

export const REFLECT_KEYS = {
  SAGA: '__SAGA__',
  SAGA_START: '__SAGA:START__',
  SAGA_FINISH: '__SAGA:FINISH__',
  SAGA_EVENT_HANDLER: '__SAGA:EVENT-HANDLER__'
}

export abstract class AbstractSaga {

  public attributes: any = {}

  public sagaId: string

  public createdAt: Date

  public updatedAt: Date

  public finishedAt?: Date

  public _state: SagaState

  async _onInit (state: SagaState) {
    this._state = state
    this.sagaId = state.sagaId
    this.attributes = state.attributes
    this.createdAt = state.createdAt
    this.updatedAt = state.updatedAt
    this.finishedAt = state.finishedAt
    if (this.onInit) {
      await this.onInit(state)
    }
  }

  abstract onInit (attributes: SagaState): Promise<void>

  async _onFinish () {
    if (this.onFinish) {
      await this.onFinish()
    }
  }

  abstract onFinish (): Promise<void>

  async _onDestroy () {
    if (this.onDestroy) {
      await this.onDestroy()
    }
  }

  abstract onDestroy (): Promise<void>

  _hasSagaEventHandler (event: Event): Array<{ handler: string, meta: SagaEventHandlerDecorator }> {
    const res = []
    for (const key in this) {
      const meta = Reflect.getMetadata(REFLECT_KEYS.SAGA_EVENT_HANDLER, this, key) as SagaEventHandlerDecorator
      if (meta) {
        if (meta.type) {
          if (isEvent(event, meta.type)) {
            res.push({ handler: key, meta })
          }
        } else if (meta.external) {
          if (event.name === meta.external.name && event.aggregateType === meta.external.aggregateType && event.context === meta.external.context) {
            res.push({ handler: key, meta })
          }
        }
      }
    }
    return res
  }

  _handleSagaEvent (handler: string, event: Event, context: Context) {
    return (this as any)[handler](event, context)
  }

}

export interface Saga {
  readonly attributes: any

  readonly sagaId: string

  onInit? (state: SagaState): Promise<void>

  onFinish? (): Promise<void>

  onDestroy? (): Promise<void>
}

export interface SagaDecorator {
  name: string
}

export function saga (value: SagaDecorator) {
  return function (target: any) {
    applyMixins(target, [AbstractSaga])
    Reflect.defineMetadata(REFLECT_KEYS.SAGA, value, target.prototype)
    return target
  }
}

export interface StartSagaDecorator {

}

export function startSaga (value: StartSagaDecorator = {}) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    // let method = descriptor.value
    // descriptor.value = function (event: Event) {
    //   return method.call(this, event)
    // }
    Reflect.defineMetadata(REFLECT_KEYS.SAGA_START, value, target, propertyKey)
  }
}

export interface FinishSagaDecorator {

}

export function finishSaga (value: FinishSagaDecorator = {}) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    // let method = descriptor.value
    // descriptor.value = function (event: Event) {
    // return method.call(this, event)
    // }
    Reflect.defineMetadata(REFLECT_KEYS.SAGA_FINISH, value, target, propertyKey)
  }
}

export interface SagaAssociationPropertyCallback {
  (attributes: any): string | Array<string> | undefined
}

export interface SagaEventValueAccessor {
  (event: Event): string
}

export interface SagaEventHandlerDecorator {
  type?: t.Type<Event>,
  external?: {
    name: string,
    context: string,
    aggregateType: string
  }
  associationProperty?: string,
  associationPropertyAccessor?: SagaAssociationPropertyCallback,
  eventValueAccessor?: SagaEventValueAccessor,
  filter?: EventFilterFunction
}

export interface EventFilterFunction {
  (event: Event): boolean
}

export function sagaEventHandler (value: SagaEventHandlerDecorator) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true
    if (!value.type && !value.external) {
      throw new Error(`Invalid sagaEvent Hanlder. Either specify type or external`)
    }
    const method = descriptor.value
    descriptor.value = function (event: Event, context: Context) {
      return method.call(this, event, context)
    }
    Reflect.defineMetadata(REFLECT_KEYS.SAGA_EVENT_HANDLER, value, target, propertyKey)
  }
}
