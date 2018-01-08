import { Event, Aggregate, SnapshotStrategy, Snapshot } from '@eventstorejs/eventstore'
import { Newable } from '@eventstorejs/core'

export type MockCommitFunction<A> = (agg: A, event: Event) => void

export class MockAggregateRepository<A extends Aggregate> {

  public aggregateType: Newable<A>

  private _callback: MockCommitFunction<A> | undefined

  constructor (type: Newable<A>, public events: Array<Event>) {
    // super(null as any, null as any, type)
    this.aggregateType = type
  }

  // public async findOne (): Promise<A> {
  //   let agg: A = new (this.aggregateType as any)(this.events)
  //   this.events.forEach(e => agg.on(e))
  //   return agg
  // }

  // public async commit (agg: A) {
  //   let event = agg['_events'][0]
  //   if (this._callback) {
  //     this._callback(agg, event)
  //   }
  //   agg['_events'] = []
  //   return event
  // }

  public onCommit (callback: MockCommitFunction<A>) {
    this._callback = callback
  }

}

export function lastEvent (events: Array<Event>) {
  return events.slice(-1).pop()
}

export class MockSnapshotStrategy extends SnapshotStrategy {

  constructor () {
    super(null as any, null as any)
  }

  async isSnapshotRequired (_events: Array<Event>) {
    return false
  }

  async findOne (_aggregateId: string): Promise<Snapshot | undefined> {
    return undefined
  }

  async storeSnapshot (_snapshot: Snapshot): Promise<void> {
    //
  }
}
