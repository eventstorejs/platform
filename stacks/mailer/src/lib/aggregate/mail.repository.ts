import { aggregateRepository, AbstractAggregateRepository, EventStore, SnapshotStrategy } from '@eventstorejs/eventstore'

import { MailAggregate } from './mail.aggregate'

@aggregateRepository({
  aggregate: MailAggregate
})
export class MailAggregateRepository extends AbstractAggregateRepository<MailAggregate> {

  constructor (eventStore: EventStore, snapshotStrategy: SnapshotStrategy) {
    super(eventStore, snapshotStrategy)
  }

}
