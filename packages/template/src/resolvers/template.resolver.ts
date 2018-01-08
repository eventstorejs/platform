import { injectable } from 'inversify'
import { join } from 'path'
// import { registerHelper, compile } from 'handlebars'
import { readFile } from 'fs-extra'
import { Config } from '@eventstorejs/core'
import { StorageService } from '@eventstorejs/storage'
import { TranslateService } from '@eventstorejs/translate'
import { logger } from '@eventstorejs/request'
import { dirSync } from 'tmp'

import { i18n, templateLocalTime, latexEscape, latexImage, compare, currency, incHelper } from '../utils'

const promisedHandlebars = require('promised-handlebars')
const Handlebars = promisedHandlebars(require('handlebars'), { Promise: Promise })

const log = logger('template')

const TEMPLATE_DEFAULT_KEY = 'default'

@injectable()
export class TemplateResolver {

  private _cache: { [key: string]: Promise<Function> } = {}

  private _templateDir = dirSync().name

  constructor (private _config: Config, private _storage: StorageService, _translate: TranslateService) {
    Handlebars.registerHelper('compare', compare)
    Handlebars.registerHelper('translate', i18n)
    Handlebars.registerHelper('moment', templateLocalTime)
    Handlebars.registerHelper('tex', latexEscape)
    Handlebars.registerHelper('texImg', latexImage)
    Handlebars.registerHelper('currency', currency)
    Handlebars.registerHelper('inc', incHelper)
  }

  async resolve (request: TemplateRequest): Promise<Promise<Function>> {
    const templateBucket = await this._config.resolve<string>(`ASSETS_BUCKET_NAME`) as string
    const templatePrefixKey = await this._config.resolve<string>('TEMPLATES_PREFIX')
    log.debug(`Resolved Template Bucket as ${templateBucket}`)
    let templateKey = request.key
    if (request.tenantKey) {
      log.info(`TenantKey is provided using it resolve template`)
      templateKey = join(request.tenantKey, request.key)
    } else {
      log.info(`No tenant key using default`)
      templateKey = join(TEMPLATE_DEFAULT_KEY, request.key)
    }
    if (templatePrefixKey) {
      templateKey = join(templatePrefixKey, templateKey)
    }
    log.debug(`Looking for template with key ${templateKey} in bucket ${templateBucket}`)
    let result: Promise<any>
    if (this._cache[templateKey]) {
      log.debug(`Found in cache returning`)
      result = this._cache[templateKey]
    } else {
      log.info(`Not Found in cache. Loading`)
      let template: string
      try {
        template = await this.resolveFromS3(templateBucket, templateKey)
      } catch (e) {
        log.warn(`Could not download`, e)
        if (!request.fallback) {
          log.info(`Fallback disabled. Throwing err`)
          throw e
        }
        if (!request.tenantKey) {
          log.info(`is already default request. Throwing`)
          throw e
        }
        log.info(`Fallback enabled and tenant specifc template. Try resolve default with ${request.key}`)
        if (templatePrefixKey) {
          template = await this.resolveFromS3(templateBucket, join(templatePrefixKey, TEMPLATE_DEFAULT_KEY, request.key))
        } else {
          template = await this.resolveFromS3(templateBucket, join(TEMPLATE_DEFAULT_KEY, request.key))
        }
      }
      log.info(`Template loaded. Processing`)
      result = await this.processTemplate(template) as any
      log.info(`Read completed. returning`)
      if (await this._config.resolve('ENABLE_TEMPLATE_CACHE', true)) {
        log.debug(`Template cache enabled adding ${templateKey}`)
        this._cache[templateKey] = result
      } else {
        log.debug(`Template cache disabled. not adding it`)
      }
    }
    return result
  }

  private async resolveFromS3 (templateBucket: string, templateKey: string): Promise<string> {
    const localFile = join(this._templateDir, templateKey)
    log.info(`Donwloading template from s3 using bucket ${templateBucket} and key ${templateKey} to localFile ${localFile}`)
    await this._storage.download({
      bucket: templateBucket,
      key: templateKey,
      localFile
    })
    log.info(`Template download completed for ${templateKey}. Reading file`)
    return await readFile(localFile, { encoding: 'utf-8' })
  }

  private async processTemplate (template: string): Promise<Promise<Function>> {
    return Handlebars.compile(template)
  }

}

export interface TemplateRequest {
  key: string
  tenantKey?: string
  fallback?: boolean
}
