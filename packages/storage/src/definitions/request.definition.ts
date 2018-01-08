import * as t from 'io-ts'
import { optional } from '@eventstorejs/api-builder'

export const FileUploadRequest = optional({
  bucket: t.string,
  key: t.string
}, {
  localFile: t.string,
  body: t.any
})

export type FileUploadRequest = t.TypeOf<typeof FileUploadRequest>

export const FileReadRequest = optional({
  bucket: t.string,
  key: t.string
}, {
  encoding: t.union([t.undefined, t.literal('base64')])
})

export type FileReadRequest = t.TypeOf<typeof FileReadRequest>

export const FileDownloadRequest = optional({
  localFile: t.string,
  bucket: t.string,
  key: t.string
}, {
  encoding: t.union([t.undefined, t.literal('base64')])
})

export type FileDownloadRequest = t.TypeOf<typeof FileDownloadRequest>
