import { interfaces } from 'inversify'

import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'

import { SagaManager, SagaStore } from './services'
import { EventStoreModule } from '@eventstorejs/eventstore'

export const SagaModule = new RegistryContainerModule((bind: interfaces.Bind) => {
  bind<SagaManager>(SagaManager).to(SagaManager).inSingletonScope()
  bind<SagaStore>(SagaStore).to(SagaStore).inSingletonScope()
}, (required: ImportModule) => {
  required(EventStoreModule)
})
