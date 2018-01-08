import { ContainerModule, interfaces } from 'inversify'
import { TranslateStore, TranslateDefaultParser, TranslateParser } from './utils'
import { TranslateService, TenantTranslateLoader } from './services'

export const TranslateModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<TenantTranslateLoader>(TenantTranslateLoader).to(TenantTranslateLoader).inSingletonScope()
  bind<TranslateParser>(TranslateParser).to(TranslateDefaultParser).inSingletonScope()
  bind<TranslateStore>(TranslateStore).to(TranslateStore).inSingletonScope()
  bind<TranslateService>(TranslateService).to(TranslateService).inSingletonScope()
})
