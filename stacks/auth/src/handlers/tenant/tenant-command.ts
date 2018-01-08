import '@eventstorejs/request'

import { Context } from '@eventstorejs/request'
import { badRequest } from 'boom'
import { TenantService, hasRole, Role } from '@eventstorejs/identity'
import { commandHandler, CommandRequestHandler, commandEventHandler, generateAggregateId } from '@eventstorejs/eventstore'
import { AuthStackModule, TenantAggregateRepository, TenantAggregate } from '../../lib'

import * as Tenant from '../../api/tenant'

// const log = logger('Garage.command-handler')
@commandHandler({
  name: 'tenant',
  context: 'auth',
  imports: [
    AuthStackModule
  ]
})
export default class UserCommandHandler implements CommandRequestHandler {

  constructor (private tenantService: TenantService, private tenantRepo: TenantAggregateRepository) {

  }

  @commandEventHandler({
    type: Tenant.CreateCommand
  })
  @hasRole([Role.Admin])
  async handleTenantCreated (command: Tenant.CreateCommand, context: Context) {
    let tenant = new TenantAggregate()
    let tenantId = command.aggregateId || generateAggregateId()
    await this.tenantService.save({
      tenantId,
      name: command.payload.name
    })
    tenant.apply({
      name: Tenant.CreatedEvent.name,
      aggregateId: tenantId,
      payload: {
        name: command.payload.name
      }
    })
    await this.tenantRepo.commit(tenant)
  }

  @commandEventHandler({
    type: Tenant.AddFeatureCommand,
    name: 'tenant.ADD_FEATURE'
  })
  @hasRole([Role.Admin])
  async handledAddFeature (command: Tenant.AddFeatureCommand, context: Context) {
    let tenant = await this.tenantRepo.findOne(command.aggregateId as string)
    tenant.apply({
      name: Tenant.AddedFeatureEvent.name,
      aggregateId: tenant.aggregateId,
      payload: {
        feature: command.payload.feature
      }
    })
    await this.tenantService.save({
      tenantId: tenant.aggregateId,
      name: tenant.attributes.name,
      features: tenant.attributes.features
    })
    await this.tenantRepo.commit(tenant)
  }

  @commandEventHandler({
    type: Tenant.RemoveFeatureCommand,
    name: 'tenant.REMOVE_FEATURE'
  })
  @hasRole([Role.Admin])
  async handledRemoveFeature (command: Tenant.RemoveFeatureCommand, context: Context) {
    let tenant = await this.tenantRepo.findOne(command.aggregateId as string)
    tenant.apply({
      name: Tenant.RemovedFeatureEvent.name,
      aggregateId: tenant.aggregateId,
      payload: {
        feature: command.payload.feature
      }
    })
    await this.tenantService.save({
      tenantId: tenant.aggregateId,
      name: tenant.attributes.name,
      features: tenant.attributes.features
    })
    await this.tenantRepo.commit(tenant)
  }

}
