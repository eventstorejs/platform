import { interfaces } from 'inversify'

import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { AwsModule } from '@eventstorejs/aws'

import { Cache } from './definitions'
import { S3Cache } from './services'

export const CacheModule = new RegistryContainerModule((bind: interfaces.Bind) => {
  bind<Cache>(Cache).to(S3Cache).inSingletonScope()
}, (required: ImportModule) => {
  required(AwsModule)
})
