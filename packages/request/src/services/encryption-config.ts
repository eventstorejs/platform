import { injectable, unmanaged, multiInject } from 'inversify'
// import { KMS } from 'aws-sdk'
import { isString } from 'lodash'
import { Config, APP_CONFIG } from '@eventstorejs/core'
import { logger } from '../logger'

const ENCRYPTION_PREFIX = '{cipher}'

const log = logger('config')

declare const Buffer: any

@injectable()
export class EncryptionConfig extends Config {

  private _decrypted: any = {}

  constructor ( @multiInject(APP_CONFIG) _config: any, @unmanaged() private _kms: any) {
    super(_config)
  }

  public async resolve<T> (name: string, def: T | undefined = undefined): Promise<T | undefined> {
    let c: any = await super.resolve<T>(name, def)
    if (c && isString(c) && (c as any).trim().indexOf(ENCRYPTION_PREFIX) === 0) {
      log.debug(`Key ${name} is encrypted. Decrypting`)
      if (this._decrypted[c]) {
        log.debug(`Already decrypted returning cached value`)
        return this._decrypted[c]
      }
      let v = (c as any).replace(ENCRYPTION_PREFIX, '').trim()
      let d = await this._kms.decrypt({
        CiphertextBlob: Buffer(v, 'base64')
      }).promise()
      this._decrypted[c] = String(d.Plaintext) as any
      return this._decrypted[c]
    }
    return c

  }

}
