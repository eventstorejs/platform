import { interfaces } from 'inversify'
import { EventStoreModule } from '@eventstorejs/eventstore'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { UserAggregateRepository, TenantAggregateRepository } from './aggregate'

export const AuthStackModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<UserAggregateRepository>(UserAggregateRepository).to(UserAggregateRepository).inSingletonScope()
    bind<TenantAggregateRepository>(TenantAggregateRepository).to(TenantAggregateRepository).inSingletonScope()
  }, (required: ImportModule) => {
    required(EventStoreModule)
  })
