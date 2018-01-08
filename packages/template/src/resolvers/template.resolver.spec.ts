import * as fs from 'fs-extra'
import { join } from 'path'
import { Mock, Times, It } from 'typemoq'

import { Config } from '@eventstorejs/core'
import { StorageService } from '@eventstorejs/storage'
import { TemplateResolver } from './template.resolver'
import { TranslateService } from '@eventstorejs/translate'

test('test resolve using non tenant', async () => {
  let config = Mock.ofType(Config)
  let storage = Mock.ofType(StorageService)
  let translate = Mock.ofType(TranslateService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('test-bucket'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('ENABLE_TEMPLATE_CACHE', It.isAny()))
    .returns(() => Promise.resolve(true))
    .verifiable(Times.atLeastOnce())

  storage.setup(x => x.download(It.isObjectWith({
    bucket: 'test-bucket',
    key: 'default/key.tex'
  } as any)))
    .returns(() => Promise.resolve('Some-Test'))
    .verifiable(Times.once())
  let service = new TemplateResolver(config.object, storage.object, translate.object)

  await fs.mkdir(join(service['_templateDir'], 'default'))
  await fs.writeFile(join(service['_templateDir'], 'default/key.tex'), `Some-Test`)

  let resolved = await service.resolve({
    key: 'key.tex'
  })
  expect(resolved).toBeDefined()
  expect(await resolved()).toBe('Some-Test')
  // second time use cache
  resolved = await service.resolve({
    key: 'key.tex'
  })
  expect(resolved).toBeDefined()
  expect(await resolved()).toBe('Some-Test')
  config.verifyAll()
  storage.verifyAll()
  translate.verifyAll()
})

test('test resolve using tenant key', async () => {
  let config = Mock.ofType(Config)
  let storage = Mock.ofType(StorageService)
  let translate = Mock.ofType(TranslateService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('test-bucket'))
    .verifiable(Times.atLeastOnce())
  config.setup(x => x.resolve('ENABLE_TEMPLATE_CACHE', It.isAny()))
    .returns(() => Promise.resolve(true))
    .verifiable(Times.atLeastOnce())

  storage.setup(x => x.download(It.isObjectWith({
    bucket: 'test-bucket',
    key: 'tenant/key.tex'
  } as any)))
    .returns(() => Promise.resolve('Some-Test'))
    .verifiable(Times.once())
  let service = new TemplateResolver(config.object, storage.object, translate.object)

  await fs.mkdir(join(service['_templateDir'], 'tenant'))
  await fs.writeFile(join(service['_templateDir'], 'tenant/key.tex'), `Some-Test`)

  let resolved = await service.resolve({
    key: 'key.tex',
    tenantKey: 'tenant'
  })
  expect(resolved).toBeDefined()
  expect(await resolved()).toBe('Some-Test')
  // second time use cache
  resolved = await service.resolve({
    key: 'key.tex',
    tenantKey: 'tenant'
  })
  expect(resolved).toBeDefined()
  expect(await resolved()).toBe('Some-Test')
  config.verifyAll()
  storage.verifyAll()
  translate.verifyAll()
})

test('test fallabck on wrong tenant key', async () => {
  let config = Mock.ofType(Config)
  let storage = Mock.ofType(StorageService)
  let translate = Mock.ofType(TranslateService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('test-bucket'))
    .verifiable(Times.atLeastOnce())

  storage.setup(x => x.download(It.is<any>(p => p.key === 'tenant/key.tex')))
    .returns(() => Promise.reject(new Error('Some not found')))
    .verifiable(Times.once())

  storage.setup(x => x.download(It.is<any>(p => p.key === 'default/key.tex')))
    .returns(() => Promise.resolve('Some-Test'))
    .verifiable(Times.once())
  let service = new TemplateResolver(config.object, storage.object, translate.object)

  await fs.mkdir(join(service['_templateDir'], 'default'))
  await fs.writeFile(join(service['_templateDir'], 'default/key.tex'), `Some-Test`)

  let resolved = await service.resolve({
    key: 'key.tex',
    tenantKey: 'tenant',
    fallback: true
  })
  expect(resolved).toBeDefined()
  expect(await resolved()).toBe('Some-Test')
  config.verifyAll()
  storage.verifyAll()
  translate.verifyAll()
})

test('test not fallback on wrong tenant key', async () => {
  expect.assertions(1)
  let config = Mock.ofType(Config)
  let storage = Mock.ofType(StorageService)
  let translate = Mock.ofType(TranslateService)

  config.setup(x => x.resolve('ASSETS_BUCKET_NAME'))
    .returns(() => Promise.resolve('test-bucket'))
    .verifiable(Times.atLeastOnce())

  storage.setup(x => x.download(It.is<any>(p => p.key === 'tenant/key.tex')))
    .returns(() => Promise.reject(new Error('Some not found')))
    .verifiable(Times.once())

  let service = new TemplateResolver(config.object, storage.object, translate.object)

  try {
    await service.resolve({
      key: 'key.tex',
      tenantKey: 'tenant',
      fallback: false
    })
  } catch (e) {
    expect(e).toBeDefined()
  }
  config.verifyAll()
  storage.verifyAll()
  translate.verifyAll()
})

const process = async (template: string, context?: any) => {
  return (await new TemplateResolver(null as any, null as any, null as any)['processTemplate'](template))(context)
}

test('test parsing latex', async () => {
  expect(await process(`
  \\documentclass[landscape]{article}
\\usepackage{tabularx}
\\usepackage{geometry}
\\usepackage{longtable}
\\usepackage{fancyhdr}
\\usepackage[utf8]{inputenc}
\\geometry{a4paper,  total={170mm,257mm},  left=15mm,  right= 25mm,  top=20mm,  bottom=20mm,  headheight=6mm}
%header
\\pagestyle{fancy}

\\begin{document}
Hello
\\end{document}`))
    .toContain(`Hello`)
})

// test('test i18n', async () => {
//   expect(await process(`{{translate 'TRANSLATE_KEY' this}}`, { 'KEY': 'VAL' })).toBe('SOME')
// })
