import { inject } from 'inversify'
import { logger, Context, Middleware, middleware } from '@eventstorejs/request'
import { TenantService } from '../services'

const log = logger('auth')

// See https://aws.amazon.com/de/blogs/mobile/integrating-amazon-cognito-user-pools-with-api-gateway/

@middleware({
  priority: 1500
})
export class TenantMiddleware implements Middleware {

  constructor (@inject(TenantService) private tenantService: TenantService) {

  }

  async preRequest (_event: any, context: Context) {
    if (!context.identity || !context.identity.tenant) {
      log.debug(`No Identity or non tenant user. Can not resolve tenant`)
      return
    }
    context.tenant = await this.tenantService.findOne(context.identity.tenant)
  }
}
