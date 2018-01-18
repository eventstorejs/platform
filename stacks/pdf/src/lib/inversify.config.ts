import { interfaces } from 'inversify'
import { RegistryContainerModule, ImportModule } from '@eventstorejs/request'
import { EventStoreModule } from '@eventstorejs/eventstore'
import { PdfAggregateRepository } from './domain'

export const PDFStackModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<PdfAggregateRepository>(PdfAggregateRepository).to(PdfAggregateRepository).inSingletonScope()
  }, (required: ImportModule) => {
    required(EventStoreModule)
  })
