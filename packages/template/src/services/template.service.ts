import { injectable } from 'inversify'

// const mjml2html = require('mjml').mjml2html
import { extname } from 'path'
import { Config } from '@eventstorejs/core'
import { TemplateResolver, TemplateRequest } from '../resolvers'
import { TranslateService, Translation } from '@eventstorejs/translate'
import { ExternalResource } from '@eventstorejs/storage'
import { logger } from '@eventstorejs/request'

const log = logger('template')

export interface ProcessedTemplate {
  template: string,
  externalResources?: Array<ExternalResource>
}

@injectable()
export class TemplateService {

  constructor (_config: Config, private _resolver: TemplateResolver, private _translate: TranslateService) {
  }

  // async resolveProcess(templ)

  async process (request: TemplateRequest, context: any = {}, translation?: Translation): Promise<ProcessedTemplate> {
    const start = Date.now()
    const compiled = await this._resolver.resolve(request)
    const lang = 'de'
    log.debug(`Resolved template. processing`)
    try {
      log.info(`Using translation ${lang} for tenant ${request.tenantKey}`)
      await this._translate.load(lang, request.tenantKey)
    } catch (e) {
      log.info(`Could not load tenant specific translatiosn. Falling back`)
      await this._translate.load(lang)
    }
    const templateContext = {
      ...context,
      i18n: translation,
      __externalResources: []
    }
    const template = await compiled(templateContext)
    const fileType = extname(request.key)
    log.debug(`Checking for postprocessing. is filetype: ${fileType}`)
    switch (fileType) {
      // case '.mjml':
      //   log.debug(`Is mjml template. Running mjml2html`)
      //   template = mjml2html(template)
      //   if (template.errors && template.errors.lenght > 0) {
      //     log.error('Could not create template')
      //     log.error(Utils.tryStringifyJson(template.errors) || 'Could not print errors')
      //     throw new Error('Could not create template')
      //   }
      //   template = template.html
      //   break
      default:
        log.debug(`Default Template. No Postprocessing`)
    }
    log.debug(`Template processing took ${Date.now() - start} millis`)

    return {
      template,
      externalResources: templateContext.__externalResources
    }
  }
}
