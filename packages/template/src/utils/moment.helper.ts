import * as moment from 'moment-timezone'
export interface MomentOptions {
  hash: {
    tz?: string
    format?: string
  }
}
export function templateLocalTime (key: string, params?: MomentOptions) {
  let outputDate: any
  outputDate = moment(key)
  if (!params || !params.hash) {
    throw new Error(`Use UTC Date`)
  }
  if (params.hash.tz && params.hash.tz !== '') {
    outputDate = outputDate.tz(params.hash.tz)
  }
  if (params.hash.format && params.hash.format !== '') {
    outputDate = outputDate.format(params.hash.format)
  }
  if (!params.hash.format || params.hash.format === '') {
    outputDate = outputDate.format('DD.MM.YYYY HH:mm')
  }
  return outputDate
}
