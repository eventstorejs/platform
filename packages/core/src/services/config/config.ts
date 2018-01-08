import { injectable, multiInject } from 'inversify'
import * as _ from 'lodash'

export class Stage {
  public static readonly DEV = 'dev'
  public static readonly STAGING = 'staging'
  public static readonly INT = 'int'
  public static readonly PROD = 'prod'
}

export class Platform {
  public static readonly NATIVE = 'native'
}

export interface ConfigMap {
  [key: string]: any
}

export const APP_CONFIG = Symbol.for('APP_CONFIG')

@injectable()
export class Config {

  protected _initComplete = false

  protected _config: ConfigMap = {}

  protected _resolveConfig: Promise<ConfigMap>

  constructor ( @multiInject(APP_CONFIG) protected _configInitializer: any) {
    // log.info(`Config initialized. Configuring logger`)
  }

  public set (key: string, value: any) {
    this._config[key] = value
  }

  public resolveSync<T> (name: string, def: T | undefined = undefined): T | undefined {
    if (!this._initComplete) {
      console.warn(`Accessing ${name} of config before initializing completed`)
    }
    if (!this._config[name]) {
      return def
    }
    return this._config[name]
  }

  public isPlatform (platform: string): boolean {
    return this.resolveSync<string>('PLATFORM') === platform
  }

  public async resolve<T> (name: string, def: T | undefined = undefined): Promise<T | undefined> {
    if (!this._resolveConfig) {
      let configs: Array<any> | Array<Promise<any>> = []
      if (this._configInitializer) {
        if (!_.isArray(this._configInitializer)) {
          configs = [this._configInitializer]
        } else {
          configs = this._configInitializer
        }
      }
      this._resolveConfig = Promise.all(configs)
        .then((resolved: Array<any>) => {
          let res = {}
          for (let c of resolved) {
            Object.assign(res, c)
          }
          this._config = {
            ... this._config,
            ...res
          }
          this._initComplete = true
          return res
        })
    }
    let config = await this._resolveConfig
    if (!config[name]) {
      return def
    }
    return config[name]
  }

}
