import { ContainerModule, interfaces } from 'inversify'

import { GraphQLProvider } from './utils'

export const GraphQLModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<GraphQLProvider>(GraphQLProvider).toProvider(GraphQLProviderFactory)
})
