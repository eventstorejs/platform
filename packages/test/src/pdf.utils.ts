import { StorageService } from '@eventstorejs/storage'
import { PdfService } from '@eventstorejs/pdf'
import { Config } from '@eventstorejs/core'
import { S3 } from 'aws-sdk'

export function setupPdfService (): PdfService {
  const config = new Config(process.env)
  const s3 = new S3()
  const pdfService = new PdfService(config, new StorageService(s3))

  return pdfService
}
