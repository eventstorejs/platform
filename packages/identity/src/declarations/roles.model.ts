import { strEnum } from '@eventstorejs/core'

export const Role = strEnum([
  'User',
  'Manager',
  'Admin'
])

export type Role = keyof typeof Role
