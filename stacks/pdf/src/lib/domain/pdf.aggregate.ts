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

  @on({ type: Pdf.Event.Pending, isCreate: true })
  public onPdfPending (event: Pdf.Event.Pending) {
    this.attributes = {
    }
  }

  @on({ type: Pdf.Event.Created })
  public onPdfCreated (event: Pdf.Event.Created) {
    this.attributes = {
    }
  }

  @on({ type: Pdf.Event.CreateFailed})
  public onPdfCreateFailed (_event: Pdf.Event.CreateFailed) {
  }

}
