import { Mock, It, Times } from 'typemoq'
import { SSMConfig } from './ssm-config'
import { SSM } from 'aws-sdk'

test('resolve encrypted varialbe', async () => {
  let key = 'eventstore/test'
  let value = 'SOME_VALUE'

  let ssm = Mock.ofType<SSM>()
  ssm.setup(x => x.getParameter(It.is<SSM.Types.GetParameterRequest>(p => {
    expect(p.Name).toBe(`/dev/eventstore/test`)
    return true
  })))
    .returns(() => ({
      promise: () => Promise.resolve<SSM.Types.GetParameterResult>({ Parameter: { Name: '/dev/eventstore/test', Value: value, Version: 1 } })
    } as any))
    .verifiable(Times.once())

  let c = new SSMConfig({
    STAGE: `dev`
  }, ssm.object)

  expect(await c.resolve<string>(key)).toBe(value)
  // expect(await c.resolve<string>(key)).toBe(value)
  ssm.verifyAll()
})


/*
Live Testing:

  let c = new SSMConfig({STAGE: 'dev'}, ssm)

  let config = await SSMConfig.resolveServiceConfig(ssm, 'dev', 'eventstore')

*/
