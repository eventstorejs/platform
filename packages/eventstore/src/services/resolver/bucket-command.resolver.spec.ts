
import { Mock, Times } from 'typemoq'
import { S3 } from 'aws-sdk'
import { Config } from '@eventstorejs/core'

import { BucketCommandResolver } from './bucket-command.resolver'
import { StorageService } from '@eventstorejs/storage'

test('test resolve command handler', async () => {
  //TODO rewrite. testing live here ...
  // const config = Mock.ofType(Config)
  // const storage = new StorageService(new S3())

  // config.setup(x => x.resolve('eventstore/bucket'))
  //   .returns(() => Promise.resolve('dev.eventstore'))
  //   .verifiable(Times.once())

  // config.setup(x => x.resolve('STAGE'))
  //   .returns(() => Promise.resolve('dev'))
  //   .verifiable(Times.once())

  // const resolver = new BucketCommandResolver(config.object, storage)

  // const result = await resolver.resolve({
  //   name: 'send',
  //   context: 'mailer'
  // })

  // expect(result.lambdaArn).toBe('arn:aws:lambda:eu-central-1:631908550553:function:mailer-dev-mailing')

  // config.verifyAll()
})
