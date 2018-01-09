import { injectable, inject } from 'inversify'
import { Config } from '@eventstorejs/core'
import { EndpointConfig } from 'graphql-weaver'
import { SSMConfig } from '@eventstorejs/request'

@injectable()
export class GraphQLEndpointResolver {

  constructor ( @inject(Config) private config: SSMConfig) {

  }

  async resolve (): Promise<EndpointConfig[]> {
    const params = this.config.resolveServiceConfig(await this.config.resolve<string>('STAGE'), 'graphcool')
    const resp = []
    for (const key in params) {
      resp.push({
        namespace: key,
        url: (params as any)[key]
      } as EndpointConfig)
    }
    return resp
  }

}
