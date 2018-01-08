import { ContainerModule, interfaces } from 'inversify'
import { MIDDLEWARE_TOKEN } from '@eventstorejs/request'
import { AuthService, TenantService } from './services'
import { IdentityMiddleware, TenantMiddleware } from './middleware'

export const IdentityModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<AuthService>(AuthService).to(AuthService).inSingletonScope()
  bind<TenantService>(TenantService).to(TenantService).inSingletonScope()
  bind<IdentityMiddleware>(MIDDLEWARE_TOKEN).to(IdentityMiddleware).inSingletonScope()
  bind<TenantMiddleware>(MIDDLEWARE_TOKEN).to(TenantMiddleware).inSingletonScope()
})
