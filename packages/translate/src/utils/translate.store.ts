import { injectable } from 'inversify'

@injectable()
export class TranslateStore {
  /**
   * The default lang to fallback when translations are missing on the current lang
   */
  public defaultLang: string

  /**
   * a list of translations per lang
   * @type {{}}
   */
  public translations: any = {}

  public hasTranslation (lang: string, tenant: string): boolean {
    if (this.translations[lang]) {
      return !!this.translations[lang][tenant]
    }
    return false
  }

}
