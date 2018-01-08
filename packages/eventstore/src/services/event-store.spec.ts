// const AWS = require('aws-sdk-mock')
// import * as SDK from 'aws-sdk'
// import { Mock, Times } from 'typemoq'

// import { Config } from '@eventstorejs/core'
// import { EventStore } from './event-store'

test('disbaled', () => {
  // TODO rewrite!!
})

// AWS.setSDKInstance(SDK)
// const AGGREGATE_ID = '123456'

// test('queryForLastEvents', async () => {
//   const payload = { some: 'data' }
//   const meta = {'extra' : 'data'}
//   AWS.mock('DynamoDB.DocumentClient', 'query', (_params: any, callback: Function) => {
//     callback(null, {
//       Items: [{
//         aggregateId: AGGREGATE_ID,
//         payload: JSON.stringify(payload),
//         meta: JSON.stringify(meta),
//         version: 0
//       }]
//     })
//   })
//   const config = Mock.ofType(Config)
//   config.setup(x => x.resolve('TABLES_EVENT'))
//     .returns(() => Promise.resolve('dummy-table'))
//     .verifiable(Times.once())

//   const strategy = Mock.ofType(ReplayPartitionStrategy)

//   const store = new EventStore(config.object, strategy.object ,new SDK.DynamoDB.DocumentClient())
//   const result = await store.query(AGGREGATE_ID)
//   expect(1).toBe(result.length)
//   expect(result[0].aggregateId).toBe(AGGREGATE_ID)
//   expect((result[0] as any).payload).toEqual(payload)
//   expect((result[0] as any).meta).toEqual(meta)
//   AWS.restore('DynamoDB.DocumentClient')
//   config.verifyAll()
// })

// test('Aggreagte not found', async () => {
//   expect.assertions(1)
//   AWS.mock('DynamoDB.DocumentClient', 'query', (_params: any, callback: Function) => {
//     callback(null, { Items: [] })
//   })
//   const config = Mock.ofType(Config)
//   config.setup(x => x.resolve('TABLES_EVENT'))
//     .returns(() => Promise.resolve('dummy-table'))
//     .verifiable(Times.once())
//   const strategy = Mock.ofType(ReplayPartitionStrategy)
//     // strategy.setup(x => x.resolvePartitionKey(It.isAny()))
//     // .returns(x => Promise.resolve('2017-31'))
//     // .verifiable(Times.once())

//   const store = new EventStore(config.object, strategy.object ,new SDK.DynamoDB.DocumentClient())
//   try {
//     await store.query('notFound')
//   } catch (e) {
//     expect(e).toBeDefined()
//   }
//   AWS.restore('DynamoDB.DocumentClient')
//   config.verifyAll()
// })
