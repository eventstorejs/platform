import 'reflect-metadata'
import 'jest'

import { Mock, It, Times } from 'typemoq'
import { SNS } from 'aws-sdk'
import { Config, Stage } from '@eventstorejs/core'
import { ExecutionService } from './execution.service'

test('lambda name resolution', async () => {
  const config = Mock.ofType(Config)
  config.setup(x => x.resolve('STAGE'))
    .returns(() => Promise.resolve(Stage.DEV))
    .verifiable(Times.atLeastOnce())

  config.setup(x => x.resolve('SERVICE'))
    .returns(() => Promise.resolve('some-service'))
    .verifiable(Times.atLeastOnce())

  const exec = new ExecutionService(config.object, null as any, null as any)
  expect(await exec.normalizeLambdaName('some-service-dev-some-command')).toBe('some-command')

  config.verifyAll()
})

test('test sns publish without payload', async () => {
  const config = Mock.ofType(Config)
  const sns = Mock.ofType(SNS)

  config.setup(x => x.resolve('REGION'))
    .returns(() => Promise.resolve('eu-central-1'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('ACCOUNT_ID'))
    .returns(() => Promise.resolve('someid'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('SNS_PREFIX'))
    .returns(() => Promise.resolve('some-wired.prefix'))
    .verifiable(Times.atLeastOnce())

  const topicName = 'some-topic'

  const targetArn = `arn:aws:sns:eu-central-1:someid:some-wired.prefix${topicName}`

  sns.setup(x => x.publish(It.is<SNS.Types.PublishInput>(p => {
    expect(p.Message).not.toBeDefined()
    expect(p.TopicArn).toBe(targetArn)
    return true
  })))
    .returns(() => ({ promise: () => Promise.resolve() } as any))
    .verifiable(Times.once())

  const exec = new ExecutionService(config.object, null as any, sns.object)

  await exec.dispatch({
    name: topicName
  })

  sns.verifyAll()
  config.verifyAll()

})

test('test sns publish without object as payload', async () => {
  const config = Mock.ofType(Config)
  const sns = Mock.ofType(SNS)

  config.setup(x => x.resolve('REGION'))
    .returns(() => Promise.resolve('eu-central-1'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('ACCOUNT_ID'))
    .returns(() => Promise.resolve('someid'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('SNS_PREFIX'))
    .returns(() => Promise.resolve('some-wired.prefix'))
    .verifiable(Times.atLeastOnce())

  const topicName = 'some-topic'

  const targetArn = `arn:aws:sns:eu-central-1:someid:some-wired.prefix${topicName}`

  const payload = {some: 'object'}

  sns.setup(x => x.publish(It.is<SNS.Types.PublishInput>(p => {
    expect(p.Message).toBe(JSON.stringify(payload))
    expect(p.TopicArn).toBe(targetArn)
    return true
  })))
    .returns(() => ({ promise: () => Promise.resolve() } as any))
    .verifiable(Times.once())

  const exec = new ExecutionService(config.object, null as any, sns.object)

  await exec.dispatch({
    name: topicName,
    payload
  })

  sns.verifyAll()
  config.verifyAll()

})
