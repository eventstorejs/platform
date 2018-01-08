
import { Context } from '@eventstorejs/request'
import { unauthorized } from 'boom'
import { AuthService } from '../services'

export function hasRole (roles: string | Array<string>) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value
    descriptor.value = function (event: any, context: Context) {
      if (!context.identity || !AuthService.hasRole(context.identity.groups || [], roles)) {
        throw unauthorized(`User has not required roles: ${roles}`)
      }
      return method.call(this, event, context)
    }
  }
}
