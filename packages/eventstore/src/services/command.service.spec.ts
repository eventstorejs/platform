import { Mock, It, Times } from 'typemoq'
import * as t from 'io-ts'

import { CommandRegistration, Command } from '@eventstorejs/eventstore'
import { ExecutionService } from '@eventstorejs/execution'
import { Config } from '@eventstorejs/core'
import { CommandResolver } from './resolver'
import { CommandService } from './command.service'

class DummyCommandResolver extends CommandResolver {

  resolve (_request: { name: string; context: string; }): Promise<CommandRegistration> {
    throw new Error('Mock method')
  }

}

test('test execution command', async () => {
  const resolver = Mock.ofType(DummyCommandResolver)
  const exec = Mock.ofType(ExecutionService)
  const config = Mock.ofType(Config)

  const commandHandler: CommandRegistration = {
    name: 'some.command',
    lambdaArn: 'someHandler',
    context: 'context',
    deployedAt: new Date()
  }
  const command = {
    name: commandHandler.name,
    context: {} as any
  }
  const identity = {} as any
  resolver.setup(x => x.resolve(It.isAny()))
    .returns(() => Promise.resolve(commandHandler))
    .verifiable(Times.once())

  exec.setup(x => x.invoke(It.isObjectWith({ lambdaArn: commandHandler.lambdaArn })))
    .returns(() => Promise.resolve<any>(null))
    .verifiable(Times.once())

  const commandService = new CommandService(config.object, resolver.object, exec.object)

  await commandService.handle(command, identity)

  resolver.verifyAll()
  exec.verifyAll()
})

test('test dispatching command', async () => {
  const resolver = Mock.ofType(DummyCommandResolver)
  const exec = Mock.ofType(ExecutionService)
  const config = Mock.ofType(Config)

  const commandHandler: CommandRegistration = {
    name: 'some.command',
    lambdaArn: 'someHandler',
    context: 'context',
    deployedAt: new Date()
  }
  const command = {
    name: commandHandler.name,
    context: {} as any
  }

  config.setup(x => x.resolve('eventstore/command-bus/arn'))
    .returns(() => Promise.resolve('commands'))
    .verifiable(Times.once())

  const identity = {} as any
  resolver.setup(x => x.resolve(It.isAny()))
    .returns(() => Promise.resolve(commandHandler))
    .verifiable(Times.once())

  // TODO validate context...
  exec.setup(x => x.dispatch(It.isObjectWith({ topicArn: 'commands' })))
    .returns(() => Promise.resolve<any>(null))
    .verifiable(Times.once())

  const commandService = new CommandService(config.object, resolver.object, exec.object)

  await commandService.dispatch(command, identity)

  // resolver.verifyAll()
  exec.verifyAll()
  config.verifyAll()
})
