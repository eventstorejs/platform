import { interfaces } from 'inversify'
import { GraphQLClient } from 'graphql-request'
import { Config } from '@eventstorejs/core'
import { logger } from '@eventstorejs/request'

const log = logger('graphql')

export const GraphQLProvider = Symbol.for('GraphQLProvider')

export type GraphQLProvider = () => Promise<GraphQLClient>

export function GraphQLProviderFactory (context: interfaces.Context) {
  const config = context.container.get<Config>(Config)
  return async () => {
    log.info(`Resolving graphql client for the first time`)
    const endpoint: string = await config.resolve<string>('GRAPHQL_ENDPOINT') as string
    return new GraphQLClient(endpoint, { headers: {} })
  }
}
