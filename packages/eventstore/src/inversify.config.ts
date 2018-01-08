import { interfaces } from 'inversify'

import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { StorageModule } from '@eventstorejs/storage'
import { ExecutionModule } from '@eventstorejs/execution'
import { AwsModule } from '@eventstorejs/aws'

import { CommandService, CommandResolver, BucketCommandResolver, EventStore, SnapshotStrategy } from './services'

export const EventStoreModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<CommandService>(CommandService).to(CommandService).inSingletonScope()
    bind<EventStore>(EventStore).to(EventStore).inSingletonScope()
    bind<SnapshotStrategy>(SnapshotStrategy).to(SnapshotStrategy).inSingletonScope()
    bind<CommandResolver>(CommandResolver).to(BucketCommandResolver).inSingletonScope()
  }, (required: ImportModule) => {
    required(StorageModule)
    required(ExecutionModule)
    required(AwsModule)
  })
