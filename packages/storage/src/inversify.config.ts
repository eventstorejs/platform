import { interfaces } from 'inversify'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { AwsModule } from '@eventstorejs/aws'
import { StorageService } from './services'

export const StorageModule = new RegistryContainerModule((bind: interfaces.Bind) => {
  bind<StorageService>(StorageService).to(StorageService).inSingletonScope()
}, (required: ImportModule) => {
  required(AwsModule)
})
