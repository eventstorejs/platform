import { ContainerModule, interfaces } from 'inversify'
import { MailService } from './services'
import { MailgunProvider, MailgunProviderFactory } from './utils'

export const MailModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MailService>(MailService).to(MailService).inSingletonScope()
  bind<MailgunProvider>(MailgunProvider).toProvider(MailgunProviderFactory)
})
