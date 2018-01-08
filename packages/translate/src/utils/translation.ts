
import { logger } from '@eventstorejs/request'

import { TranslateParser } from './translate.parser'

const log = logger('tranlation')

export class Translation {

  public readonly createdAt = new Date()

  constructor (public readonly language: string, public readonly tenant: string, public translations: any, private parser: TranslateParser) {

  }

  get (key: Array<string> | string, interpolateParams?: any) {
    let translateKey
    if (key instanceof Array) {
      translateKey = key.join('.')
    } else {
      translateKey = key
    }
    const res = this.parser.interpolate(this.parser.getValue(this.translations, translateKey), interpolateParams) as string | undefined
    if (typeof res === 'undefined') {
      // TODO handle unknown texts nicer
      log.error(`Could not get translation for ${translateKey}`)
      return translateKey
    }
    return res
  }
}
