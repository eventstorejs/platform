const detectDate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/

export function parseISODate (value: string) {
  if (typeof (value as any) === 'string' && (detectDate.test(value))) {
    return new Date(value)
  }
  return value
}

export function parseJson<T>(value: string) {
  return JSON.parse(value, (_key, value) => parseISODate(value)) as T
}

export function tryParseJson<T>(input: string | any): T {
  let res = input
  try {
    res = parseJson(input as string)
  } catch (e) {
    //
  }
  return res
}

export function stringifyJson (input: any): string {
  return JSON.stringify(input)
}

export function tryStringifyJson (input: any): string | undefined {
  try {
    return stringifyJson(input)
  } catch (e) {
    return undefined
  }
}

export function tryValue (value: Function, defaultValue?: any) {
  try {
    return value()
  } catch (e) {
    return defaultValue
  }
}

// Legacy
export class Utils {

  public static parseISODate = parseISODate

  public static parseJson = parseJson

  public static tryParseJson = tryParseJson

  public static stringifyJson = stringifyJson

  public static tryStringifyJson = tryStringifyJson

  public static tryValue = tryValue

}
