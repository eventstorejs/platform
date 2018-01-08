import { interfaces } from 'inversify'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { AwsModule } from '@eventstorejs/aws'
import { StorageModule } from '@eventstorejs/storage'
import { EventStoreModule } from '@eventstorejs/eventstore'
import { SchedulerService } from './services'
import { TriggerAggregateRepository } from './aggregate'

export const SchedulerStackModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<SchedulerService>(SchedulerService).to(SchedulerService).inSingletonScope()
    bind<TriggerAggregateRepository>(TriggerAggregateRepository).to(TriggerAggregateRepository).inSingletonScope()
  }, (required: ImportModule) => {
    required(AwsModule)
    required(StorageModule)
    required(EventStoreModule)
  })
