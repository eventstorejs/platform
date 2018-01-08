import { injectable, inject } from 'inversify'
import { S3 } from 'aws-sdk'
import { S3_TOKEN } from '@eventstorejs/aws'
import { Config, parseJson, stringifyJson } from '@eventstorejs/core'

import { Cache } from '../definitions'

export interface CacheMap {
  [key: string]: {
    etag: string,
    data: any
  }
}

@injectable()
export class S3Cache implements Cache {

  protected _cache: CacheMap = {}

  protected _cacheBucket = this.config.resolve<string>('eventstore/bucket')

  constructor (@inject(Config) private config: Config, @inject(S3_TOKEN) private s3: S3) {

  }

  async getItem<D> (key: string): Promise<D | undefined> {
    if (!key) {
      throw new Error(`CacheKey is not defined`)
    }
    let cached = this._cache[key]
    try {
      let req = {
        Bucket: await this._cacheBucket as string,
        Key: `cache/${key}`,
        IfNoneMatch: cached ? cached.etag : undefined
      }
      let resp = await this.s3.getObject(req).promise()
      this._cache[key] = {
        data: parseJson(resp.Body as string),
        etag: resp.ETag as string
      }
      return this._cache[key].data

    } catch (err) {
      if (err.code === 'NotModified') {
        return cached.data as D
      } else {
        return undefined
      }
    }
  }

  async putItem (key: string, data: any): Promise<void> {
    if (!key) {
      throw new Error(`CacheKey is not defined`)
    }
    let resp = await this.s3.putObject({
      Bucket: await this._cacheBucket as string,
      Key: `cache/${key}`,
      Body: stringifyJson(data),
      ContentType: 'application/json'
    }).promise()
    this._cache[key] = {
      data: data,
      etag: resp.ETag as string
    }
  }

  async invalidateItem (key: string): Promise<void> {
    if (!key) {
      throw new Error(`CacheKey is not defined`)
    }
    try {
      await this.s3.deleteObject({
        Bucket: await this._cacheBucket as string,
        Key: `cache/${key}`
      }).promise()
      delete this._cache[key]
    } catch (err) {
      if (err.code === 'NoSuchKey') {
        delete this._cache[key]
        return
      }
      throw err
    }
  }

}
