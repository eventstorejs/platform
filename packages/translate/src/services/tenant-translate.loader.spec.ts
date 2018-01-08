import { Mock, Times, It } from 'typemoq'

import { Config } from '@eventstorejs/core'
import { StorageService } from '@eventstorejs/storage'
import { TenantTranslateLoader } from './tenant-translate.loader'

test('test resolve using non tenant', async () => {
  const config = Mock.ofType(Config)
  const storage = Mock.ofType(StorageService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('SOME_BUCKET'))
    .verifiable(Times.once())

  storage.setup(x => x.read(It.isObjectWith({ bucket: 'SOME_BUCKET', key: 'default/i18n/de.yml' })))
    .returns(() => Promise.resolve(`KEY: VALUE`))
    .verifiable(Times.once())

  const loader = new TenantTranslateLoader(config.object, storage.object)

  const translations = await loader.getTranslation('de', 'default')

  expect(translations).toMatchObject({ 'KEY': 'VALUE' })

  config.verifyAll()
  storage.verifyAll()
})

test('test resolve using tenant', async () => {
  const config = Mock.ofType(Config)
  const storage = Mock.ofType(StorageService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('SOME_BUCKET'))
    .verifiable(Times.once())

  // storage.setup(x => x.read(It.isObjectWith({ bucket: 'SOME_BUCKET', key: 'default/i18n/de.json' })))
  //   .returns(() => Promise.resolve(JSON.stringify({ 'KEY': 'VALUE', 'ORG' : 'ORG' })))
  //   .verifiable(Times.once())

  storage.setup(x => x.read(It.isObjectWith({ bucket: 'SOME_BUCKET', key: 'tenant/i18n/de.yml' })))
    .returns(() => Promise.resolve(`KEY: TENANT_VALUE`))
    .verifiable(Times.once())

  const loader = new TenantTranslateLoader(config.object, storage.object)

  const translations = await loader.getTranslation('de', 'tenant')

  expect(translations).toMatchObject({ 'KEY': 'TENANT_VALUE' })

  config.verifyAll()
  storage.verifyAll()
})

// test('test lang split', async () => {
//   let loader = new TenantTranslateLoader(null as any, null as any)
//   expect(loader['splitLanguageKey']('ten-de')).toMatchObject({tenant: 'ten', lang: 'de'})
//   expect(loader['splitLanguageKey']('de')).toMatchObject({tenant: undefined, lang: 'de'})
//   expect(loader['splitLanguageKey']('ten-de-DE')).toMatchObject({tenant: 'ten', lang: 'de-DE'})
// })
