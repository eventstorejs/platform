
import { Context } from '@eventstorejs/request'
import { AuthService } from '../services'
import { Role } from '../declarations'

export function setOnRole<T> (context: Context | undefined, roles: Array<string> | string, roleValue: T, defaultValue: T): T {
  if (AuthService.hasRole(context && context.identity ? context.identity.groups : [], roles)) {
    return roleValue
  }
  return defaultValue
}

export function setOnAdmin<T> (context: Context | undefined, adminValue: T, defaultValue: T): T {
  return setOnRole<T>(context, Role.Admin, adminValue, defaultValue)
}

export function setTenant (context: Context | undefined, tenant: string, unAuthenticatedTenant?: string) {
  if (!context || !context.identity || !context.identity.tenant) {
    return unAuthenticatedTenant
  }
  return setOnAdmin<string>(context, tenant, context.identity.tenant)
}
