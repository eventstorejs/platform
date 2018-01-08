import { aggregateRepository, AbstractAggregateRepository, EventStore, SnapshotStrategy } from '@eventstorejs/eventstore'

import { UserAggregate } from './user.aggregate'

@aggregateRepository({
  aggregate: UserAggregate
})
export class UserAggregateRepository extends AbstractAggregateRepository<UserAggregate> {

  constructor (eventStore: EventStore, snapshotStrategy: SnapshotStrategy) {
    super(eventStore, snapshotStrategy)
  }

}
