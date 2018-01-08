import { interfaces } from 'inversify'
import { TemplateService } from './services'
import { TemplateResolver } from './resolvers'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { TranslateModule } from '@eventstorejs/translate'

export const TemplateModule = new RegistryContainerModule((bind: interfaces.Bind) => {
  bind<TemplateService>(TemplateService).to(TemplateService).inSingletonScope()
  bind<TemplateResolver>(TemplateResolver).to(TemplateResolver).inSingletonScope()
},(required: ImportModule) => {
  required(TranslateModule)
})
