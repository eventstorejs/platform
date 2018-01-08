import { Mock, It, Times } from 'typemoq'
import {  } from 'inversify'
import * as t from 'io-ts'

import { SagaManager, SagaStore, Saga, saga, sagaEventHandler, SagaState, startSaga, finishSaga } from '@eventstorejs/saga'
import { Event } from '@eventstorejs/eventstore'

const DummyEvent = t.intersection([Event, t.interface({
  name: t.literal('DummyEvent'),
  payload: t.interface({
    key: t.string
  })
})], 'DummyEvent')

type DummyEvent = t.TypeOf<typeof DummyEvent>

const OtherDummyEvent = t.intersection([Event, t.interface({
  name: t.literal('OtherDummyEvent')
})], 'OtherDummyEvent')

type OtherDummyEvent = t.TypeOf<typeof OtherDummyEvent>

const GlobalDummyEvent = t.intersection([Event, t.interface({
  name: t.literal('GlobalDummyEvent')
})], 'GlobalDummyEvent')

type GlobalDummyEvent = t.TypeOf<typeof GlobalDummyEvent>

const DummyStartEvent = t.intersection([Event, t.interface({
  name: t.literal('DummyStartEvent')
})], 'DummyStartEvent')

type DummyStartEvent = t.TypeOf<typeof DummyStartEvent>

@saga({ name: 'dummy-saga' })
class DummySaga implements Saga {
  attributes: any
  sagaId: string = 'saga-id'

  isStarted = false

  @sagaEventHandler({ type: DummyStartEvent })
  @startSaga()
  public async startSaga (event: DummyStartEvent) {
    if (!t.is(event, DummyStartEvent)) {
      throw new Error('Not DummyStartEvent')
    }
    this.isStarted = true
  }

  @sagaEventHandler({ associationProperty: 'key', type: DummyEvent })
  public async handleSomething (event: DummyEvent) {
    if (!t.is(event, DummyEvent)) {
      throw new Error('Not dummy event')
    }
    this.attributes.reference = event.aggregateId
    this.attributes.key = event.payload.key
  }

  @sagaEventHandler({
    associationProperty: 'ignore-name',
    associationPropertyAccessor: (att) => att.other,
    type: OtherDummyEvent
  })
  @finishSaga()
  public async handleSomethingDifferent (event: OtherDummyEvent) {
    if (!t.is(event, OtherDummyEvent)) {
      throw new Error('Not dummy event')
    }
  }

  @sagaEventHandler({ type: GlobalDummyEvent })
  public async globalHandleSomething (_event: GlobalDummyEvent) {
    //
  }

}

test('test resolve attribute', async () => {
  const manager = new SagaManager(null as any)
  expect(manager['getAttributeValues'](
    { key: [{ 't': '1' }, { 't': '2' }] }, (att: any) => att.key.map((x: any) => x.t)))
    .toEqual(['1', '2'])
  expect(manager['getAttributeValues']({ key: 'value' }, 'key')).toEqual(['value'])
  expect(manager['getAttributeValues']({ key: { key: 'value' } }, 'key.key')).toEqual(['value'])
  expect(manager['getAttributeValues'](undefined, 'unknown')).toEqual([])
  expect(manager['getAttributeValues']({ key: 'value' }, 'unknown')).toEqual([])
  expect(manager['getAttributeValues']({ key: 'value' }, 'key.unknown')).toEqual([])

  expect(() => manager['getAttributeValues']({ key: { key: 'value' } }, 'key')).toThrow()
})

test('test commit with attributes', async () => {
  const store = Mock.ofType(SagaStore)
  const manager = new SagaManager(store.object)

  store.setup(x => x.put(It.isObjectWith<SagaState>({
    attributes: { key: 'value', other: 'prop' },
    sagaId: 'saga-id',
    sagaType: 'dummy-saga'
  }), It.is(att => {
    if (!att || att.length !== 3) {
      return false
    }
    if (att[0].isGlobal !== false || att[0].sagaType !== 'dummy-saga' || (att[0].type as any).name !== DummyEvent.name || att[0].name !== 'key' || att[0].value !== 'value') {
      return false
    }
    if (att[1].isGlobal !== false || att[1].sagaType !== 'dummy-saga' || (att[1].type as any).name !== OtherDummyEvent.name || att[1].name !== 'ignore-name' || att[1].value !== 'prop') {
      return false
    }
    if (att[2].isGlobal !== true || att[2].sagaType !== 'dummy-saga' || (att[2].type as any).name !== GlobalDummyEvent.name || att[2].name !== undefined || att[2].value !== undefined) {
      return false
    }
    return true
  })))
    .returns(() => Promise.resolve())
    .verifiable(Times.once())

  const saga = new DummySaga()
  saga.attributes = {
    key: 'value',
    other: 'prop'
  }
  await manager.commit(saga)

  store.verifyAll()
})

test('test commit without attributes', async () => {
  const store = Mock.ofType(SagaStore)
  const manager = new SagaManager(store.object)

  store.setup(x => x.put(It.isObjectWith<SagaState>({
    attributes: {},
    sagaId: 'saga-id',
    sagaType: 'dummy-saga'
  }), It.is(att => {
    if (!att || (att as any).length !== 1) {
      return false
    }
    if (att[0].isGlobal !== true || att[0].sagaType !== 'dummy-saga' || (att[0].type as any).name !== GlobalDummyEvent.name) {
      return false
    }
    return true
  })))
    .returns(() => Promise.resolve())
    .verifiable(Times.once())

  const saga = new DummySaga()
  saga.attributes = {
  }
  await manager.commit(saga)

  store.verifyAll()
})

test('test handle start new saga', async () => {
  const store = Mock.ofType(SagaStore)
  const manager = new SagaManager(store.object)

  const saga = new DummySaga()

  let startCalled = false
  let isInitCalled = false;
  (saga as any)['_onInit'] = (state: SagaState) => {
    isInitCalled = true
    expect(state).toBeDefined()
    expect(state.sagaId).toBeDefined()
    expect(state.sagaType).toBe('dummy-saga')
    expect(state.createdAt).toBeDefined()
  }

  (saga as any)['_onFinish'] = () => {
    fail()
  }

  (saga as any)['startSaga'] = (event: DummyStartEvent) => {
    expect(event).toBeDefined()
    expect(t.is(event, DummyStartEvent)).toBe(true)
    startCalled = true
  }

  store.setup(x => x.findByAssociation(It.isAny()))
    .verifiable(Times.never())

  const event: DummyStartEvent = {
    name: 'DummyStartEvent',
    aggregateId: 'my-id'
  }
  await manager.handle(event, null as any, saga as any)

  store.verifyAll()

  expect(isInitCalled).toBe(true)
  expect(startCalled).toBe(true)
})

test('test handle event of two existing sagas', async () => {
  const store = Mock.ofType(SagaStore)
  const manager = new SagaManager(store.object)

  const saga = new DummySaga()

  let handlerCalled = 0
  let isInitCalled = false;
  (saga as any)['onInit'] = (state: SagaState) => {
    expect(state).toBeDefined()
    if (handlerCalled === 0) {
      expect(state.sagaId).toBe('saga-id')
    }
    if (handlerCalled === 1) {
      expect(state.sagaId).toBe('saga-id-2')
    }
    expect(state.sagaType).toBe('dummy-saga')
    expect(state.createdAt).toBeDefined()
    isInitCalled = true
  }

  (saga as any)['_onFinish'] = () => {
    fail()
  }

  (saga as any)['handleSomething'] = function (event: DummyEvent) {
    expect(event).toBeDefined()
    expect(t.is(event, DummyEvent)).toBe(true)
    if (handlerCalled === 0) {
      expect(this.sagaId).toBe('saga-id')
    }
    if (handlerCalled === 1) {
      expect(this.sagaId).toBe('saga-id-2')
    }
    handlerCalled++
  }

  store.setup(x => x.findByAssociation(It.isObjectWith({ sagaType: 'dummy-saga', name: 'key', type: DummyEvent, value: 'my-id', isGlobal: false })))
    .returns(() => Promise.resolve([{
      sagaId: 'saga-id',
      sagaType: 'dummy-saga',
      createdAt: new Date()
    } as SagaState, {
      sagaId: 'saga-id-2',
      sagaType: 'dummy-saga',
      createdAt: new Date()
    } as SagaState]))
    .verifiable(Times.once())

  const event: DummyEvent = {
    name: 'DummyEvent',
    aggregateId: 'my-id',
    payload: {
      key: 'val'
    }
  }
  await manager.handle(event, null as any, saga as any)

  store.verifyAll()

  expect(isInitCalled).toBe(true)
  expect(handlerCalled).toBe(2)
})

test('test finish saga', async () => {
  const store = Mock.ofType(SagaStore)
  const manager = new SagaManager(store.object)

  const saga = new DummySaga()

  let handlerCalled = false
  let finishCalled = false
  let isInitCalled = false;
  (saga as any)['_onInit'] = (state: SagaState) => {
    expect(state).toBeDefined()
    expect(state.sagaId).toBe('saga-id')
    expect(state.sagaType).toBe('dummy-saga')
    expect(state.createdAt).toBeDefined()
    isInitCalled = true
  }

  (saga as any)['_onFinish'] = () => {
    finishCalled = true
  }

  (saga as any)['handleSomethingDifferent'] = (event: OtherDummyEvent) => {
    expect(event).toBeDefined()
    expect(t.is(event, OtherDummyEvent)).toBe(true)
    handlerCalled = true
  }

  store.setup(x => x.findByAssociation(It.isObjectWith({ sagaType: 'dummy-saga', name: 'ignore-name', type: OtherDummyEvent, value: 'my-id', isGlobal: false })))
    .returns(() => Promise.resolve([{
      sagaId: 'saga-id',
      sagaType: 'dummy-saga',
      createdAt: new Date()
    } as SagaState]))
    .verifiable(Times.once())

  const event: OtherDummyEvent = {
    name: 'OtherDummyEvent',
    aggregateId: 'my-id'
  }
  await manager.handle(event, null as any, saga as any)

  store.verifyAll()

  expect(isInitCalled).toBe(true)
  expect(handlerCalled).toBe(true)
  expect(finishCalled).toBe(true)
})
