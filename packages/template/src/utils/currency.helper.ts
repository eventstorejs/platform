import { isNumber } from 'lodash'

export interface CurrencyHelperOptions {
  curreny?: string
  locale?: string
}

export function currency (input: number = 0, params: CurrencyHelperOptions): string | undefined {
  let options = {
    locale: 'de-DE',
    curreny: 'EUR',
    ...params
  }
  let formatter = new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.curreny,
    minimumFractionDigits: 2
  })
  if (!isNumber(input)) {
    throw new Error('Not a number provided')
  }
  return formatter.format(input / 100)
}
