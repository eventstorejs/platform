import { aggregate, Aggregate, on } from '@eventstorejs/eventstore'
import * as User from '../../../api/user'

export interface UserAggregateAttributes {
}

@aggregate({
  name: 'user',
  context: 'auth'
})
export class UserAggregate implements Aggregate {

  public aggregateId: string

  public attributes: UserAggregateAttributes = {}

  apply: (event: User.Events) => void

  @on({ type: User.CreatedEvent, isCreate: true })
  public onUserCreated (event: User.CreatedEvent) {
    this.attributes = {
    }
  }

}
