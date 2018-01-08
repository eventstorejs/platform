import { inject } from 'inversify'
import { logger, Context, Middleware, middleware } from '@eventstorejs/request'
import { AuthService } from '../services'

const log = logger('auth')

// See https://aws.amazon.com/de/blogs/mobile/integrating-amazon-cognito-user-pools-with-api-gateway/

@middleware({
  priority: 1000
})
export class IdentityMiddleware implements Middleware {

  constructor (@inject(AuthService) private authService: AuthService) {

  }

  async preRequest (_event: any, context: Context) {
    let token = context.headers ? context.headers['Authorization'] : undefined
    if (token && token.indexOf('Bearer ') >= 0) {
      token = token.substr('Bearer '.length)
    }
    if (!token) {
      log.debug(`No token present`)
      return
    }
    context.identity = await this.authService.resolveToken(token)
  }
}
