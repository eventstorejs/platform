import { injectable, inject } from 'inversify'
import { createReadStream, writeFile, readFile } from 'fs-extra'
import { badRequest } from 'boom'
import { S3 } from 'aws-sdk'
import { logger } from '@eventstorejs/request'
import { S3_TOKEN } from '@eventstorejs/aws'
import { FileUploadRequest, FileDownloadRequest, FileReadRequest } from '../definitions'

const log = logger('storage')

@injectable()
export class StorageService {

  constructor ( @inject(S3_TOKEN) private s3: S3) {

  }

  async upload (request: FileUploadRequest) {
    log.debug(`Tryging to upload file to bucket ${request.bucket} and key ${request.key}`)
    let body
    if (request.localFile) {
      log.info(`Using localFile ${request.localFile}`)
      body = createReadStream(request.localFile)
    } else if (request.body) {
      body = request.body
    } else {
      throw badRequest(`Either set localFile or body for upload`)
    }
    let res = await this.s3.putObject({
      Bucket: request.bucket,
      Key: request.key,
      Body: body
    }).promise()

    return {
      eTag: res.ETag
    }
  }

  async read (request: FileReadRequest): Promise<S3.Body | undefined> {
    log.info(`Reading file from bucket ${request.bucket} and key ${request.key}`)
    let res = (await this.s3.getObject({
      Bucket: request.bucket,
      Key: request.key
    }).promise())

    return res.Body
  }

  async readDirectory (request: FileReadRequest): Promise<Array<{ key: string, lastModified: Date, value: S3.Body | undefined }>> {
    let nextToken
    let result = []
    log.debug(`Reading s3 directory on ${request.bucket} with prefix ${request.key}`)
    do {
      let res: S3.Types.ListObjectsOutput = await (this.s3.listObjects({
        Bucket: request.bucket, /* required */
        Prefix: request.key,
        Marker: nextToken
      }).promise())
      log.debug(`Received ${(res.Contents || []).length} file keys`)
      for (let r of (res.Contents || [])) {
        result.push({
          key: r.Key as string,
          lastModified: r.LastModified as Date,
          value: await this.read({ bucket: request.bucket, key: r.Key as string })
        })
      }
      nextToken = res.NextMarker
      if (nextToken) {
        log.debug(`Have nextToken: ${nextToken}. Read more s3 keys`)
      }
    } while (nextToken)

    return result

  }

  async download (request: FileDownloadRequest) {
    log.info(`Tryging to download file from bucket ${request.bucket} and key ${request.key}`)

    let res = await this.s3.getObject({
      Bucket: request.bucket,
      Key: request.key
    }).promise()

    if (request.encoding) {
      log.info(`Has encoding ${request.encoding}. Running post processing`)
      switch (request.encoding) {
        case 'base64':
          let localFileContent = await readFile(request.localFile, 'utf-8')
          await writeFile(request.localFile, Buffer.from(localFileContent, 'base64'))
          break
        default:
          log.warn(`No post processing handler found for ${request.encoding}`)
      }
    } else {
      await writeFile(request.localFile, res.Body, { encoding: 'utf-8' })
    }
  }

}
