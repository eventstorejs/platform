import { injectable } from 'inversify'
import { isNull, isUndefined } from 'lodash'

@injectable()
export abstract class TranslateParser {
  /**
   * Interpolates a string to replace parameters
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   * @param expr
   * @param params
   * @returns {string}
   */
  abstract interpolate (expr: string | Function, params?: any): string

  /**
   * Gets a value from an object by composed key
   * parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
   * @param target
   * @param key
   * @returns {string}
   */
  abstract getValue (target: any, key: string): any
}

@injectable()
export class TranslateDefaultParser extends TranslateParser {
  templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g

  public interpolate (expr: string | Function | any, params?: any): string {
    let result: string

    if (typeof expr === 'string') {
      result = this.interpolateString(expr, params)
    } else if (typeof expr === 'function') {
      result = this.interpolateFunction(expr, params)
    } else {
      // this should not happen, but an unrelated TranslateService test depends on it
      result = expr as string
    }

    return result
  }

  getValue (inputTarget: any, inputKey: string): any {
    const keys = inputKey.split('.')
    let target = inputTarget
    let key = ''
    do {
      key += keys.shift()
      if (!isNull(target) && !isUndefined(target) && !isNull(target[key]) && !isUndefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
        target = target[key]
        key = ''
      } else if (!keys.length) {
        target = undefined
      } else {
        key += '.'
      }
    } while (keys.length)

    return target
  }

  private interpolateFunction (fn: Function, params?: any) {
    return fn(params)
  }

  private interpolateString (expr: string, params?: any) {
    if (!params) {
      return expr
    }

    return expr.replace(this.templateMatcher, (substring: string, b: string) => {
      const r = this.getValue(params, b)
      return !isNull(r) && !isUndefined(r) ? r : substring
    })
  }
}
