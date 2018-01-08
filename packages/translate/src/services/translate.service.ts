import { injectable, inject } from 'inversify'

import { merge } from 'lodash'
import { TranslateStore, TranslateParser, Translation } from '../utils'

import { logger } from '@eventstorejs/request'
import { TenantTranslateLoader } from './tenant-translate.loader'

const log = logger('translate')

@injectable()
export class TranslateService {

  public static readonly DEFAULT_KEY = 'default'

  constructor (
    @inject(TranslateStore) private store: TranslateStore,
    @inject(TenantTranslateLoader) private currentLoader: TenantTranslateLoader,
    @inject(TranslateParser) private parser: TranslateParser) {
  }

  async load (lang: string, tenantKey?: string): Promise<Translation> {
    log.info(`Loading language ${lang} for ${tenantKey}`)
    let translations = await this.fromStoreOrLoad(lang, TranslateService.DEFAULT_KEY)
    if (tenantKey) {
      try {
        translations = merge(translations, await this.fromStoreOrLoad(lang, tenantKey))
      } catch (e) {
        log.info(`Could not load tenant specific files for ${tenantKey}`)
      }
    }
    return new Translation(lang, tenantKey || TranslateService.DEFAULT_KEY, translations, this.parser)
  }

  private async fromStoreOrLoad (lang: string, tenantKey: string) {
    if (this.store.hasTranslation(lang, tenantKey)) {
      return this.store.translations[lang][tenantKey]
    } else {
      const translation = await this.currentLoader.getTranslation(lang, tenantKey)
      log.info(`Loaded Translation putting it in store`)
      if (!this.store.translations[lang]) {
        this.store.translations[lang] = {}
      }
      this.store.translations[lang][tenantKey] = translation
      return translation
    }
  }

}
