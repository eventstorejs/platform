import { Mock, It, Times } from 'typemoq'
import { DynamoDB, S3 } from 'aws-sdk'
import * as t from 'io-ts'

import { Config } from '@eventstorejs/core'
import { SagaStore, SagaState } from '@eventstorejs/saga'
import { event } from '@eventstorejs/eventstore'

const DummyEvent = event({
  aggregateType: 'aggregate',
  context: 'context',
  name: 'DummyEvent'
}, t.interface({
  key: t.string
}))

test('test findOne with found item', async () => {
  const config = new Config({
    'eventstore/tables/saga': 'saga'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.query(It.isObjectWith({
    TableName: 'saga',
    ExpressionAttributeValues: {
      ':s': 'saga-id'
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Items: [{
          sagaId: 'saga-id'
        }]
      })
    } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  const state = await store.findOne('saga-id')

  expect(state).toBeDefined()
  db.verifyAll()

})

test('test findOne throw on not found', async () => {
  expect.assertions(1)
  const config = new Config({
    'eventstore/tables/saga': 'saga'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.query(It.isObjectWith({
    TableName: 'saga',
    ExpressionAttributeValues: {
      ':s': 'saga-id'
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Items: []
      })
    } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  try {
    await store.findOne('saga-id')
  } catch (e) {
    expect(e).toBeDefined()
  }
  db.verifyAll()
})

test('test find many by assertion', async () => {
  const config = new Config({
    'eventstore/tables/saga': 'saga',
    'eventstore/tables/saga-association': 'asso'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.query(It.isObjectWith({
    TableName: 'asso',
    ExpressionAttributeValues: {
      ':s': 'dummy-saga#context.aggregate.DummyEvent-name#value'
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Items: [{ sagaId: 'id-1' }, { sagaId: 'id-2' }]
      })
    } as any))
    .verifiable(Times.once())

  db.setup(x => x.batchGet(It.isObjectWith({
    RequestItems: {
      'saga': { Keys: [{ sagaId: 'id-1' }, { sagaId: 'id-2' }] }
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Responses: { 'saga': [{ sagaId: 'id-1', attributes: {} }, { sagaId: 'id-2', attributes: {} }] }
      })
    } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  const state = await store.findByAssociation({sagaType: 'dummy-saga', name: 'name', type: DummyEvent, value: 'value', isGlobal: false})

  expect(state).toBeDefined()
  db.verifyAll()
})

test('test find many by global assertion', async () => {
  const config = new Config({
    'eventstore/tables/saga': 'saga',
    'eventstore/tables/saga-association': 'asso'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.query(It.isObjectWith({
    TableName: 'asso',
    ExpressionAttributeValues: {
      ':s': 'dummy-saga#context.aggregate.DummyEvent'
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Items: [{ sagaId: 'id-1' }, { sagaId: 'id-2' }]
      })
    } as any))
    .verifiable(Times.once())

  db.setup(x => x.batchGet(It.isObjectWith({
    RequestItems: {
      'saga': { Keys: [{ sagaId: 'id-1' }, { sagaId: 'id-2' }] }
    }
  })))
    .returns(() => ({
      promise: () => Promise.resolve({
        Responses: { 'saga': [{ sagaId: 'id-1', attributes: {} }, { sagaId: 'id-2', attributes: {} }] }
      })
    } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  const state = await store.findByAssociation({sagaType: 'dummy-saga', type: DummyEvent, isGlobal: true})

  expect(state).toBeDefined()
  db.verifyAll()
})

test('test put new saga', async () => {
  const config = new Config({
    'eventstore/tables/saga': 'saga',
    'eventstore/tables/saga-association': 'asso'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.batchWrite(It.is(p => {
    try {
      expect(p).toEqual(expect.objectContaining({
        RequestItems: expect.objectContaining({
          asso: expect.arrayContaining([expect.objectContaining({
            PutRequest: expect.objectContaining({
              Item: expect.objectContaining({ associationKey: 'dummy-saga#context.aggregate.DummyEvent-key#v', sagaId: 'saga-id' })
            })
          })])
        })
      }))
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  })))
    .returns(() => ({
      promise: () => Promise.resolve()
    } as any))
    .verifiable(Times.once())

  db.setup(x => x.put(It.is(p => {
    try {
      expect(p).toEqual(expect.objectContaining({
        TableName: 'saga',
        Item: expect.objectContaining({ sagaId: 'saga-id', sagaType: 'dummy-saga' })
      }))
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  })))
    .returns(() => ({ promise: () => Promise.resolve() } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  const state = {
    sagaId: 'saga-id',
    sagaType: 'dummy-saga'
  } as SagaState

  const associations = [
    { sagaType: 'dummy-saga', name: 'key', value: 'v', type: DummyEvent, isGlobal: false }
  ]
  await store.put(state, associations)

  expect(state).toBeDefined()
  db.verifyAll()
})

test('test put existing saga and remove old keys. but keep merged', async () => {
  const config = new Config({
    'eventstore/tables/saga': 'saga',
    'eventstore/tables/saga-association': 'asso'
  })
  const db = Mock.ofType(DynamoDB.DocumentClient)
  const s3 = Mock.ofType(S3)

  db.setup(x => x.batchWrite(It.is(p => {
    try {
      expect(p).toEqual(expect.objectContaining({
        RequestItems: expect.objectContaining({
          asso: expect.arrayContaining([
            expect.objectContaining({ PutRequest: expect.objectContaining({ Item: expect.objectContaining({ associationKey: 'dummy-saga#context.aggregate.DummyEvent-key#v', sagaId: 'saga-id' }) }) }),
            expect.objectContaining({ DeleteRequest: expect.objectContaining({ Key: expect.objectContaining({ associationKey: 'dummy-saga#context.aggregate.DummyEvent-remove-key#v' }) }) })
          ])

        })
      }))
      expect(p.RequestItems['asso'].length).toBe(2)
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  })))
    .returns(() => ({
      promise: () => Promise.resolve()
    } as any))
    .verifiable(Times.once())

  db.setup(x => x.put(It.is(p => {
    try {
      expect(p).toEqual(expect.objectContaining({
        TableName: 'saga',
        Item: expect.objectContaining({ sagaId: 'saga-id', sagaType: 'dummy-saga' })
      }))
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  })))
    .returns(() => ({ promise: () => Promise.resolve() } as any))
    .verifiable(Times.once())

  const store = new SagaStore(config, db.object, s3.object)

  const state = {
    sagaId: 'saga-id',
    sagaType: 'dummy-saga',
    _associationKeys: ['dummy-saga#context.aggregate.DummyEvent-old-key#v', 'dummy-saga#context.aggregate.DummyEvent-remove-key#v']
  } as SagaState

  const associations = [
    { sagaType: 'dummy-saga', name: 'key', value: 'v', type: DummyEvent, isGlobal: false },
    { sagaType: 'dummy-saga', name: 'old-key', value: 'v', type: DummyEvent, isGlobal: false }
  ]
  await store.put(state, associations)

  expect(state).toBeDefined()
  db.verifyAll()
})
