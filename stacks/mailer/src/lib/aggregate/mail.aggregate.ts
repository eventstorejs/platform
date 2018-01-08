import { aggregate, Aggregate, on } from '@eventstorejs/eventstore'
import * as Mail from '../../api/mail'

export interface MailAggregateAttributes {
  email?: Mail.EMail,
  status?: 'IN_PROGRESS' | 'SENDED' | 'FAILED'
}

@aggregate({
  name: 'mail',
  context: 'mailer'
})
export class MailAggregate implements Aggregate {

  public aggregateId: string

  public attributes: MailAggregateAttributes = {}

  apply: (event: Mail.Events) => void

  @on({ type: Mail.AddedEvent, isCreate: true })
  public onMailAdded (event: Mail.AddedEvent) {
    this.attributes = {
      email: event.payload.email,
      status: 'IN_PROGRESS'
    }
  }

  @on({ type: Mail.SendedEvent })
  public onMailSended (_event: Mail.SendedEvent) {
    this.attributes.status = 'SENDED'
  }

  @on({ type: Mail.SendFailureEvent })
  public onMailSendFailure (_event: Mail.SendFailureEvent) {
    this.attributes.status = 'FAILED'
  }

}
