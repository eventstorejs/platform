
import { injectable, inject } from 'inversify'
import { join } from 'path'
import * as yml from 'js-yaml'

import { Config } from '@eventstorejs/core'
import { StorageService } from '@eventstorejs/storage'
import { logger } from '@eventstorejs/request'

const log = logger('translate')

@injectable()
export class TenantTranslateLoader {

  constructor (
    @inject(Config) private config: Config,
    @inject(StorageService) private storage: StorageService) {
  }

  public async getTranslation (lang: string, tenant: string): Promise<any> {
    let bucketKey = join(tenant, 'i18n', `${lang}.yml`)
    log.info(`Getting translations for ${tenant} with lang ${lang} as key ${bucketKey}`)
    const bucket = await this.config.resolve('ASSETS_BUCKET_NAME') as string
    const bucketPrefix = await this.config.resolve<string>('TRANSLATION_PREFIX')
    if (bucketPrefix) {
      bucketKey = join(bucketPrefix, bucketKey)
    }
    log.debug(`Resolved tempaltes bucket to ${bucket}`)
    const file = await this.storage.read({
      bucket,
      key: bucketKey
    })
    log.debug(`Read file success. Parsing`)
    return yml.load(file as string)
  }

}
