import { Mock, It, Times } from 'typemoq'

import { Config } from '@eventstorejs/core'
import { TemplateService } from './template.service'
import { TemplateResolver } from '../resolvers'
import { TranslateService } from '@eventstorejs/translate'

const TEMPLATE = `\
<div>Hi Me!</div>
<div>26</div>`

test('test default template enging', async () => {
  expect.assertions(2)
  const config = Mock.ofType(Config)
  const resolver = Mock.ofType(TemplateResolver)
  const translate = Mock.ofType(TranslateService)

  const context = { name: 'Me', age: '26' }

  translate.setup(x => x.load('de', undefined))
    .returns(() => Promise.resolve(null as any))
    .verifiable(Times.once())

  resolver.setup(x => x.resolve(It.isObjectWith({ key: 'someKey' })))
    .returns(() => Promise.resolve<Promise<Function>>(Promise.resolve<Function>((c: any) => {
      expect(c).toMatchObject(context)
      return TEMPLATE
    })))
    .verifiable(Times.once())

  const service = new TemplateService(config.object, resolver.object, translate.object)

  const processed = await service.process({ key: 'someKey' }, context)

  expect(processed.template).toBe(TEMPLATE)
  resolver.verifyAll()
  translate.verifyAll()
})

test('test fallback on missing lang', async () => {
  expect.assertions(2)
  const config = Mock.ofType(Config)
  const resolver = Mock.ofType(TemplateResolver)
  const translate = Mock.ofType(TranslateService)

  const context = { name: 'Me', age: '26' }

  translate.setup(x => x.load('de', 'tenant'))
    .returns(() => Promise.reject(new Error('blub')))
    .verifiable(Times.once())

  translate.setup(x => x.load('de', undefined))
    .returns(() => Promise.resolve(null as any))
    .verifiable(Times.once())

  resolver.setup(x => x.resolve(It.isObjectWith({ key: 'someKey', tenantKey : 'tenant' })))
    .returns(() => Promise.resolve<Promise<Function>>(Promise.resolve<Function>((c: any) => {
      expect(c).toMatchObject(context)
      return TEMPLATE
    })))
    .verifiable(Times.once())

  const service = new TemplateService(config.object, resolver.object, translate.object)

  const processed = await service.process({ key: 'someKey', tenantKey : 'tenant' }, context)

  expect(processed.template).toBe(TEMPLATE)
  resolver.verifyAll()
  translate.verifyAll()
})
