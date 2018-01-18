import { aggregate, Aggregate, on } from '@eventstorejs/eventstore'
import * as Pdf from '../../api/pdf'

export interface PdfAggregateAttributes {
}

@aggregate({
  name: 'pdf',
  context: 'pdf'
})
export class PdfAggregate implements Aggregate {

  public aggregateId: string

  public attributes: PdfAggregateAttributes

  apply: (event: Pdf.Events) => void

  @on({ type: Pdf.PendingEvent, isCreate: true })
  public onPdfPending (event: Pdf.PendingEvent) {
    this.attributes = {
    }
  }

  @on({ type: Pdf.CreatedEvent })
  public onPdfCreated (event: Pdf.CreatedEvent) {
    this.attributes = {
    }
  }

  @on({ type: Pdf.CreateFailedEvent})
  public onPdfCreateFailed (_event: Pdf.CreateFailedEvent) {
  }

}
