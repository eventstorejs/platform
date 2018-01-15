
import { injectable, inject } from 'inversify'
import { get, isString, isArray, isNumber, isObject, isUndefined, isNull } from 'lodash'
import { SagaStore, AssociationAttribute } from './saga.store'
import { Saga, AbstractSaga, REFLECT_KEYS, SagaEventHandlerDecorator, SagaAssociationPropertyCallback, SagaDecorator, StartSagaDecorator } from '../decorators'
import { SagaState } from '../definitions'
import { Event, generateAggregateId } from '@eventstorejs/eventstore'
import { logger, Logger, Context } from '@eventstorejs/request'

export const log: Logger = logger('saga')

export interface HandledSaga {
  state: SagaState,
  commit: CommitCallback
}

export interface CommitCallback {
  (): Promise<void>
}

@injectable()
export class SagaManager {

  constructor ( @inject(SagaStore) private store: SagaStore) {

  }

  async handle (receivedEvents: Event | Array<Event>, context: Context, saga: AbstractSaga) {
    let events: Array<Event> = receivedEvents as any
    if (!isArray(receivedEvents)) {
      events = [receivedEvents]
    }
    const sagaConfig = Reflect.getMetadata(REFLECT_KEYS.SAGA, saga) as SagaDecorator
    for (const event of events) {
      const handlers = saga._hasSagaEventHandler(event)
      if (handlers.length > 0) {
        log.info(`has ${handlers.length} Event Handler for ${event.name}`)
        for (const handler of handlers) {
          if (handler.meta.filter) {
            log.debug(`EventHandler has filter Function`)
            if (!handler.meta.filter(event)) {
              log.debug(`Filter criteria not machted. not handling for saga`)
              continue
            }
          }
          const startEvent = !!Reflect.getMetadata(REFLECT_KEYS.SAGA_START, saga, handler.handler)
          let sagaStates = []
          if (startEvent) {
            log.info(`is Saga Start Event`)
            sagaStates.push({
              sagaId: generateAggregateId(),
              sagaType: sagaConfig.name,
              attributes: {},
              createdAt: new Date(),
              updatedAt: new Date()
            })
          } else {
            log.info(`Is existing saga`)
            const association = this.resolveAssocation(handler.meta, sagaConfig.name)
            if (!association.isGlobal) {
              if (handler.meta.eventValueAccessor) {
                association.value = handler.meta.eventValueAccessor(event)
                // TODO: if no value is returned cancel here. maybe add option to allow this also
                if (isUndefined(association.value) || isNull(association.value)) {
                  continue
                }
              } else {
                association.value = event.aggregateId
              }

            }
            sagaStates = await this.store.findByAssociation(association)
            log.info(`Resolved to ${sagaStates.length} sagas`)
          }
          for (const sagaState of sagaStates) {

            await saga._onInit(sagaState)

            await saga._handleSagaEvent(handler.handler, event, context)

            const finishEvent = !!Reflect.getMetadata(REFLECT_KEYS.SAGA_FINISH, saga, handler.handler)

            await this.commit(saga, finishEvent)

            if (finishEvent) {
              log.info(`is Finish Event. Calling on finish`)
              await saga._onFinish()
            }

            await saga._onDestroy()
          }
        }

      } else {
        log.debug(`Not a Event Saga is interested in`)
      }
    }
    log.debug(`Finished handling.`)

  }

  // async restore (sagaId: string): Promise<Saga> {
  //   log.info(`Restoring saga: ${sagaId}`)
  //   const state = await this.store.findOne(sagaId)
  //   log.debug(`Found Saga as type: ${state.sagaType}`)
  //   const sagaType = sagas[state.sagaType]
  //   if (!sagaType) {
  //     throw new Error(`Could not find saga type: ${sagaType}`)
  //   }
  //   log.debug(`Resolved saga ${sagaId} as ${sagaType}`)
  //   const saga = this.injector.get<AbstractSaga>(sagaType)
  //   await saga._onInit(state)
  //   log.debug(`Resotred saga`)
  //   return saga
  // }

  async commit (saga: Saga, finish: boolean = false): Promise<void> {
    log.info(`Commiting saga: ${saga.sagaId}`)
    let associationAttributes: Array<AssociationAttribute> = []
    const sagaConfig = Reflect.getMetadata(REFLECT_KEYS.SAGA, saga) as SagaDecorator
    if (!sagaConfig) {
      throw new Error(`SagaConfig not found. Add @saga annotation`)
    }
    for (const key in saga) {
      const meta = Reflect.getMetadata(REFLECT_KEYS.SAGA_EVENT_HANDLER, saga, key) as SagaEventHandlerDecorator
      const isStart = Reflect.getMetadata(REFLECT_KEYS.SAGA_START, saga, key) as StartSagaDecorator
      if (meta && !isStart) {
        let associationsToAdd: Array<AssociationAttribute> = []
        const associationConfig = this.resolveAssocation(meta, sagaConfig.name)
        if (associationConfig.isGlobal) {
          associationsToAdd = [associationConfig]
        } else {
          associationsToAdd = this.getAttributeValues(saga.attributes, (meta.associationPropertyAccessor || meta.associationProperty) as any)
            .map((v) => ({
              ...associationConfig,
              name: meta.associationProperty,
              value: v
            } as AssociationAttribute))
        }
        associationAttributes = [
          ...associationAttributes,
          ...associationsToAdd
        ]
      }
    }
    const state = {
      sagaId: saga.sagaId,
      sagaType: sagaConfig.name,
      attributes: {
        ...saga.attributes
      },
      createdAt: (saga as AbstractSaga).createdAt || new Date(),
      updatedAt: new Date(),
      finishedAt: finish ? new Date() : undefined
    } as SagaState
    log.info(`Commited saga: ${saga.sagaId}`)
    return this.store.put(state, associationAttributes)

  }

  private resolveAssocation (meta: SagaEventHandlerDecorator, sagaType: string): AssociationAttribute {
    if (meta.associationProperty) {
      return {
        name: meta.associationProperty,
        sagaType,
        type: meta.type,
        external: meta.external,
        isGlobal: false
      }
    } else {
      return {
        sagaType,
        type: meta.type,
        external: meta.external,
        isGlobal: true
      }
    }

  }

  private getAttributeValues (attributes: any, key: string | SagaAssociationPropertyCallback): Array<string> {
    if (!attributes) {
      return []
    }
    let res
    if (isString(key)) {
      res = get(attributes, key)
    } else {
      res = key(attributes)
    }
    if (!res) {
      res = []
    }
    if (isArray(res)) {
      return res
    }
    if (isString(res)) {
      return [res]
    }
    if (isNumber(res)) {
      return [`${res}`]
    }
    if (isObject(res)) {
      throw new Error(`Attribtue value cant be an object`)
    }
    return []
  }

}
