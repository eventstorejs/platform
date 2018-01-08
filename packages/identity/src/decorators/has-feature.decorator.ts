
import { Context } from '@eventstorejs/request'
import { unauthorized } from 'boom'
import { AuthService } from '../services'

export function hasFeature (feature: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value
    descriptor.value = function (event: any, context: Context) {
      if (context.identity && context.identity.isAdmin) {
        return true
      }
      if (!context.tenant || !AuthService.hasFeature(context.tenant.features || [], feature)) {
        throw unauthorized(`User has not required to access feature: ${feature}.`)
      }
      return method.call(this, event, context)
    }
  }
}
