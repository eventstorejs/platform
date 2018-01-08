
import { Context } from '@eventstorejs/request'
import { unauthorized } from 'boom'

export function isAuthenticated () {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value
    descriptor.value = function (event: any, context: Context) {
      if (!context.identity) {
        throw unauthorized(`User is not authenticated`)
      }
      return method.call(this, event, context)
    }
  }
}
