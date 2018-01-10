import { injectable, inject } from 'inversify'
import { Config } from '@eventstorejs/core'
import { EndpointConfig } from 'graphql-weaver'
import { SSMConfig } from '@eventstorejs/request'

@injectable()
export class GraphQLEndpointResolver {

  constructor ( @inject(Config) private config: SSMConfig) {

  }

  async resolve (): Promise<EndpointConfig[]> {
    const params = await this.config.resolveServiceConfig(await this.config.resolve<string>('STAGE'), 'graphcool')
    const resp = []
    for (const key in params) {
      resp.push({
        namespace: key,
        url: `https://api.graph.cool/simple/v1/${(params as any)[key].split('/')[1]}`
      } as EndpointConfig)
    }
    return resp
  }

}
