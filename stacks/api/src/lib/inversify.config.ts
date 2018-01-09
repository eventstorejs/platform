import { interfaces } from 'inversify'
import { RegistryContainerModule } from '@eventstorejs/request'
import { GraphQLEndpointResolver } from './utils'

export const ApiStackModule = new RegistryContainerModule(
  (bind: interfaces.Bind) => {
    bind<GraphQLEndpointResolver>(GraphQLEndpointResolver).to(GraphQLEndpointResolver).inSingletonScope()
  })
