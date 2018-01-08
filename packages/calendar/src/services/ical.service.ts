import { injectable, inject } from 'inversify'
import { isArray } from 'lodash'
import { CalEvent } from '../definitions'

export const ICAL = Symbol.for('ICAL')

export interface LocationAddress {
  street: string,
  houseNo: string,
  zip: string,
  city: string
}

@injectable()
export class ICALService {

  constructor (@inject(ICAL) public ical: any) {

  }

  async createEvent (event: Array<CalEvent> | CalEvent): Promise<string> {
    let icalEvent = this.ical({
      domain: 'radwechseldich.de',
      prodId: '//radwechseldich.de//ical-rwd//DE'
    })
    let events: Array<CalEvent> = isArray(event) ? event : [event]
    for (let e of events) {
      let icalE = icalEvent.createEvent(e)
      if (e.alarms) {
        for (let a of e.alarms) {
          icalE.createAlarm(a)
        }
      }
    }
    return icalEvent.toString()
  }

  toLocation (address: LocationAddress | undefined) {
    if (!address) {
      return ''
    }
    return `${address.street} ${address.houseNo}, ${address.zip} ${address.city}`
  }
}
