import { interfaces } from 'inversify'

import { RegistryContainerModule } from '@eventstorejs/request'

import { ExecutionService } from './services'

export const ExecutionModule = new RegistryContainerModule((bind: interfaces.Bind) => {
  bind<ExecutionService>(ExecutionService).to(ExecutionService).inSingletonScope()
})
