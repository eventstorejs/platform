import { interfaces } from 'inversify'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { EventStoreModule } from '@eventstorejs/eventstore'
import { MailAggregateRepository } from './aggregate'

export const MailStackModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<MailAggregateRepository>(MailAggregateRepository).to(MailAggregateRepository).inSingletonScope()
  }, (required: ImportModule) => {
    required(EventStoreModule)
  })
