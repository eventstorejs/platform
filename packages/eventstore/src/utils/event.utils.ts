import * as cuid from 'cuid'

export function generateAggregateId () {
  return cuid().toString()
}
