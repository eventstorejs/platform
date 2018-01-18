import '@eventstorejs/request'
import { CqrsModule, cqrsHandler, cqrsEventHandler, CqrsHandler, CqrsContext } from '@eventstorejs/cqrs'
import { logger } from '@eventstorejs/request'

import * as Pdf from '../api/pdf'

const log = logger('cqrs')

@cqrsHandler({
  name: 'pdf-cqrs',
  imports: [
    CqrsModule
  ]
})
export default class PdfCqrsHandler implements CqrsHandler {

  constructor () {

  }

  // @cqrsEventHandler({ type: Mail.AddedEvent })
  // async onMailAdded (event: Mail.AddedEvent, context: CqrsContext) {
  //   log.info(`Handling MailAdded event for ${event.aggregateId}`)
  // }

}
