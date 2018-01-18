import { aggregateRepository, AbstractAggregateRepository, EventStore, SnapshotStrategy } from '@eventstorejs/eventstore'

import { PdfAggregate } from './pdf.aggregate'

@aggregateRepository({
  aggregate: PdfAggregate
})
export class PdfAggregateRepository extends AbstractAggregateRepository<PdfAggregate> {

  constructor (eventStore: EventStore, snapshotStrategy: SnapshotStrategy) {
    super(eventStore, snapshotStrategy)
  }

}
