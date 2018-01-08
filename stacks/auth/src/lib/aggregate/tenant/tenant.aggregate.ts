import { aggregate, Aggregate, on } from '@eventstorejs/eventstore'
import * as Tenant from '../../../api/tenant'

export interface TenantAggregateAttributes {
  name: string
  features: Array<string>
}

@aggregate({
  name: 'tenant',
  context: 'auth'
})
export class TenantAggregate implements Aggregate {

  public aggregateId: string

  public attributes: TenantAggregateAttributes

  apply: (event: Tenant.Events) => void

  @on({ type: Tenant.CreatedEvent, isCreate: true })
  public onTenantCreated (event: Tenant.CreatedEvent) {
    this.attributes = {
      name: event.payload.name,
      features: []
    }
  }

  @on({ type: Tenant.AddedFeatureEvent, isCreate: true })
  public onFeatureAdded (event: Tenant.AddedFeatureEvent) {
    this.attributes = {
      ... this.attributes,
      features: [
        ... this.attributes.features,
        event.payload.feature
      ]
    }
  }

  @on({ type: Tenant.RemovedFeatureEvent, isCreate: true })
  public onFeatureRemoved (event: Tenant.RemovedFeatureEvent) {
    this.attributes = {
      ... this.attributes,
      features: this.attributes.features.filter(f => f !== event.payload.feature)
    }
  }

}
