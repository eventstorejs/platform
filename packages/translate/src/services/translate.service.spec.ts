import { Mock, Times } from 'typemoq'

import { TranslateService, TranslateDefaultParser, TranslateStore, TenantTranslateLoader, Translation } from '@eventstorejs/translate'

test('test resolve using non tenant', async () => {
  const store = new TranslateStore()
  const loader = Mock.ofType(TenantTranslateLoader)
  const parser = new TranslateDefaultParser()

  loader.setup(x => x.getTranslation('de', 'default'))
    .returns(() => Promise.resolve({}))
    .verifiable(Times.once())

  const translation = new TranslateService(store, loader.object, parser)

  const trans = await translation.load('de')

  expect(trans).toBeInstanceOf(Translation)

  loader.verifyAll()

})

test('test resolve using tenant', async () => {
  const store = new TranslateStore()
  const loader = Mock.ofType(TenantTranslateLoader)
  const parser = new TranslateDefaultParser()
  loader.setup(x => x.getTranslation('de', 'default'))
    .returns(() => Promise.resolve({ 'KEY': 'VALUE', 'O': 'O' }))
    .verifiable(Times.once())

  loader.setup(x => x.getTranslation('de', 'tenant'))
    .returns(() => Promise.resolve({ 'TENANT_KEY': 'TENANT_VALUE', 'O': 'X' }))
    .verifiable(Times.once())

  const translation = new TranslateService(store, loader.object, parser)

  const trans = await translation.load('de', 'tenant')

  expect(trans).toBeInstanceOf(Translation)

  expect(trans.translations).toMatchObject({ 'KEY': 'VALUE', 'TENANT_KEY': 'TENANT_VALUE', 'O': 'X' })
  loader.verifyAll()

})
