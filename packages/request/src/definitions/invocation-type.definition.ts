import { strEnum } from '@eventstorejs/core'

export const InvocationType = strEnum([
  'SYNC',
  'ASYNC'
])
export type InvocationType = keyof typeof InvocationType
