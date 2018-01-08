import { aggregateRepository, AbstractAggregateRepository, EventStore, SnapshotStrategy } from '@eventstorejs/eventstore'

import { TriggerAggregate } from './trigger.aggregate'

@aggregateRepository({
  aggregate: TriggerAggregate
})
export class TriggerAggregateRepository extends AbstractAggregateRepository<TriggerAggregate> {

  constructor (eventStore: EventStore, snapshotStrategy: SnapshotStrategy) {
    super(eventStore, snapshotStrategy)
  }

}
