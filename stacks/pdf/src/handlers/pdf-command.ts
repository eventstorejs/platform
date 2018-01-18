import '@eventstorejs/request'

import { basename } from 'path'
import { Config } from '@eventstorejs/core'
import { Context, logger, done } from '@eventstorejs/request'
import { ErrorUtils } from '@eventstorejs/api-builder'
import { PdfModule, PdfService, PdfResult } from '@eventstorejs/pdf'
import { commandHandler, CommandRequestHandler, commandEventHandler } from '@eventstorejs/eventstore'
import * as Pdf from '../api/pdf'
import { PDFStackModule, PdfAggregateRepository, PdfAggregate } from '../lib'
import { StorageModule, StorageService } from '@eventstorejs/storage'

const log = logger('command')

@commandHandler({
  name: 'pdf-command',
  context: 'pdf',
  imports: [
    PdfModule,
    StorageModule,
    PDFStackModule
  ]
})
export default class PdfCommandHandler implements CommandRequestHandler {

  constructor (
    private config: Config,
    private pdf: PdfService,
    private storage: StorageService,
    private pdfRepo: PdfAggregateRepository) {

  }

  @commandEventHandler({
    type: Pdf.CreateCommand
  })
  async handlePdfCreate (command: Pdf.CreateCommand, _context: Context) {
    const agg = new PdfAggregate()
    try {
      agg.apply({
        name: Pdf.PendingEvent.name,
        payload: {
          ... command.payload
        }
      } as Pdf.CreatedEvent)
      const pdf = await this.pdf.process(command.payload.template, {
        clean: false,
        externalResources: command.payload.externalResources
      }) as PdfResult
      log.info(`PDF Created.`)
      const remotePath = `pdf/${agg.aggregateId}/${basename(pdf.resultPath)}`
      const bucket = await this.config.resolve('OUTPUT_BUCKET_NAME') as string
      log.info(`Uploading to s3 Bucket: ${bucket} and key ${remotePath}`)
      await this.storage.upload({
        localFile: pdf.resultPath,
        bucket,
        key: remotePath
      })
      log.info(`Upload completed for ${remotePath}. Clean and dipatch created event`)
      pdf.clean()
      agg.apply({
        name: Pdf.CreatedEvent.name,
        payload: {
          path: remotePath,
          bucket
        }
      } as Pdf.CreatedEvent)
      await this.pdfRepo.commit(agg)
      log.info(`Created Event Disptached. All done`)
      return done(200, {
        aggregateId: agg.aggregateId
      })
    } catch (e) {
      log.error(`PDF creation failed`, e)
      await agg.apply({
        name: Pdf.CreateFailedEvent.name,
        payload: {
          reason: ErrorUtils.build({ key: 'INTERNAL', message: ErrorUtils.parseAsMessage(e) })
        }
      } as Pdf.CreateFailedEvent)
      await this.pdfRepo.commit(agg)
      return done(500, {
        aggregateId: agg.aggregateId
      })
    }
  }

}
