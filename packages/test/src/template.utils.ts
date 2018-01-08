import { Mock, It } from 'typemoq'
import { join, dirname } from 'path'
import * as fs from 'fs'
import * as yml from 'js-yaml'
import { S3 } from 'aws-sdk'

import { Config } from '@eventstorejs/core'
import { TemplateService, TemplateResolver } from '@eventstorejs/template'
import { StorageService, FileDownloadRequest } from '@eventstorejs/storage'
import { TranslateStore, TranslateService, TenantTranslateLoader, TranslateDefaultParser } from '@eventstorejs/translate'

export function setupTemplateService () {
  const config = new Config(process.env)
  const s3 = new S3()
  const storage = new StorageService(s3)
  const translate = new TranslateService(new TranslateStore(), new TenantTranslateLoader(config, storage), new TranslateDefaultParser())
  const resolver = new TemplateResolver(config, storage, translate)

  return new TemplateService(config, resolver, translate)
}
export function setupTranslateService () {
  const config = new Config(process.env)
  const s3 = new S3()
  const storage = new StorageService(s3)

  return new TranslateService(new TranslateStore(), new TenantTranslateLoader(config, storage), new TranslateDefaultParser())
}

export async function setupLocalTemplateService (path: string) {
  const config = new Config({})
  const storage = Mock.ofType(StorageService)
  const translate = Mock.ofType(TranslateService)
  const resolver = new TemplateResolver(config, storage.object, translate.object)
  const service = new TemplateService(config, resolver, translate.object)
  storage.setup(x => x.download(It.is<FileDownloadRequest>(p => {
    const tm = fs.readFileSync(path)
    if (!fs.existsSync(dirname(p.localFile))) {
      fs.mkdirSync(dirname(p.localFile))
    }
    fs.writeFileSync(p.localFile, tm, { encoding: 'utf-8' })
    return true
  })))
    .returns(() => Promise.resolve() as any)

  return service
}

export function setupLocalTranslationLoader () {
  return {
    getTranslation: async (lang: string, tenant: string) => {
      return yml.load(fs.readFileSync(join(__dirname, '..', '..', '..', 'templates', tenant, 'i18n', `${lang}.yml`), {encoding: 'utf-8'}))
    }
  } as TenantTranslateLoader
}
