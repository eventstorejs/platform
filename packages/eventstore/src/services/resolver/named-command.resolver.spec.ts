// import * as t from 'io-ts'
// import { Mock } from 'typemoq'
// // import { ExecutionService } from '../execution'
// import { Config } from '@eventstorejs/core'
// // import { Aggregate } from '@app/events'
// import { CommandResolver } from './command.resolver'
// import { CommandNotFoundError } from './command.errors'
// import { Command } from '@api'

test('disabled', () => {
  // tests disabled
})

// test('register command', async () => {
//   let resolver = new CommandResolver()
//   resolver.register('some.command', 'handler')
// })

// test('no duplicate commands', async () => {
//   expect.assertions(1)
//   let resolver = new CommandResolver()
//   let command = 'some.command'
//   resolver.register(command, 'handler')
//   try {
//     resolver.register(command, 'other.handler')
//   } catch (e) {
//     expect(e).toBeDefined()
//   }
// })

// test('test resolve command handler', async () => {
//   let config = Mock.ofType(Config)

//   let command = 'some.command'

//   let resolver = new CommandResolver(config.object, {
//     [command] : {
//       name: command,
//       handler: 'some-handler',
//       type: t.intersection([Command, t.interface({})])
//     }
//   })

//   let result = await resolver.resolve(command)
//   expect(result.name).toBe(command)
//   expect(result.handler).toBe('some-handler')

//   config.verifyAll()
// })

// test('throw error on unkown command', async () => {
//   expect.assertions(1)

//   let config = Mock.ofType(Config)

//   let resolver = new CommandResolver(config.object, {})

//   try {
//     await resolver.resolve('some.unkown.command')
//   } catch (e) {
//     expect(e).toBeInstanceOf(CommandNotFoundError)
//   }

// })

// // Tests for using lambda resolution
// // test('resolve command handler', async () => {
// //   let exec = Mock.ofType(ExecutionService)
// //   let config = Mock.ofType(Config)
// //   exec.setup(x => x.list())
// //     .returns(() => Promise.resolve([{ name: 'dev-some-command' }]))
// //     .verifiable(Times.once())

// //   exec.setup(x => x.normalizeLambdaName('dev-some-command'))
// //     .returns(() => Promise.resolve('some-command'))
// //     .verifiable(Times.atLeastOnce())

// //   let resolver = new CommandResolver(config.object, exec.object)
// //   let command = 'some.command'

// //   let result = await resolver.resolve(command)
// //   expect(result.name).toBe(command)
// //   expect(result.handler).toBe('some-command')
// //   exec.verifyAll()
// //   config.verifyAll()
// // })

// // test('throw error on unkown command', async () => {
// //   expect.assertions(1)

// //   let exec = Mock.ofType(ExecutionService)
// //   let config = Mock.ofType(Config)
// //   exec.setup(x => x.list())
// //     .returns(() => Promise.resolve([{ name: 'dev-some-command' }]))
// //     .verifiable(Times.once())

// //   exec.setup(x => x.normalizeLambdaName('dev-some-command'))
// //     .returns(() => Promise.resolve('some-command'))
// //     .verifiable(Times.atLeastOnce())

// //   let resolver = new CommandResolver(config.object, exec.object)

// //   try {
// //     await resolver.resolve('some.unkown.command')
// //   } catch (e) {
// //     expect(e).toBeInstanceOf(CommandNotFoundError)
// //   }

// //   exec.verifyAll()

// // })
