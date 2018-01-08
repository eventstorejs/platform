import { aggregateRepository, AbstractAggregateRepository, EventStore, SnapshotStrategy } from '@eventstorejs/eventstore'

import { TenantAggregate } from './tenant.aggregate'

@aggregateRepository({
  aggregate: TenantAggregate
})
export class TenantAggregateRepository extends AbstractAggregateRepository<TenantAggregate> {

  constructor (eventStore: EventStore, snapshotStrategy: SnapshotStrategy) {
    super(eventStore, snapshotStrategy)
  }

}
