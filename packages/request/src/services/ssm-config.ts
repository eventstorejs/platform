import { injectable, inject, multiInject } from 'inversify'
import { SSM } from 'aws-sdk'
import { set } from 'lodash'
import { Config, APP_CONFIG } from '@eventstorejs/core'
import { logger } from '../logger'
import { SSM_TOKEN } from '@eventstorejs/aws'

const log = logger('config')

@injectable()
export class SSMConfig extends Config {

  constructor( @multiInject(APP_CONFIG) config: any, @inject(SSM_TOKEN) private ssm: SSM) {
    super(config)
  }

  public static async resolveServiceConfig (ssm: SSM, stage?: string, service?: string) {
    let nextToken
    let path = `/${stage || process.env['STAGE']}/${service || process.env['SERVICE']}`
    let parameters = {}
    do {
      let res: SSM.Types.GetParametersByPathResult = await ssm.getParametersByPath({
        NextToken: nextToken,
        Path: path,
        Recursive: true,
        WithDecryption: true
      }).promise()
      if (res && res.Parameters) {
        for (let p of res.Parameters) {
          if (p && p.Name) {
            let parameterName = p.Name.replace(`${path}/`, '').split('/').join('.')
            set(parameters, parameterName, p.Value ? p.Value.trim() : p.Value)
          }
        }
      }
      nextToken = res.NextToken
    } while (nextToken)
    return parameters
  }

  public async resolve<T>(name: string, def: T | undefined = undefined): Promise<T | undefined> {
    let parameter = await super.resolve<T>(name)
    if (parameter) {
      log.debug(`Parameter ${name} received from local config`)
      return parameter
    }
    parameter = def
    log.debug(`Did not found ${name} local. Resolve using ssm`)
    let stage = await super.resolve<string>('STAGE')
    if (!stage) {
      throw new Error(`Could not resolve Paramater. Unknown stage`)
    }
    let paramterName = `/${stage}${name.charAt(0) !== '/' ? '/' : ''}${name}`
    log.debug(`Getting paramter with key: ${paramterName}`)
    try {
      let p = await this.ssm.getParameter({
        Name: paramterName,
        WithDecryption: true
      }).promise()
      parameter = p.Parameter && p.Parameter.Value ? p.Parameter.Value.trim() as any : undefined
    } catch (e) {
      if (e.code !== 'ParameterNotFound') {
        throw e
      }
    }
    return parameter

  }
}

// export const SSM_APP_CONFIG = [
//   { provide: APP_CONFIG, useValue: { ...process.env } }
//   // {
//   //   provide: APP_CONFIG,
//   //   deps: [SSM_TOKEN],
//   //   useFactory: (ssm: SSM) => SSMConfig.resolveServiceConfig(ssm)
//   // }
// ]
