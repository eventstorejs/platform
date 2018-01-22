// import * as t from 'io-ts'
// import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
// import { PathReporter } from 'io-ts/lib/PathReporter'
import { injectable } from 'inversify'
import { badRequest } from 'boom'
import { Newable } from '@eventstorejs/core'
import { logger, CONTEXT, makeInjectable } from '@eventstorejs/request'
import { Event } from '../../definitions'
import { EventStore } from '../event-store'
import { Aggregate, AGGREGATE_REFLECT_KEYS, AbstractAggregate, AggregateDecorator } from './aggregate'
import { SnapshotStrategy } from '../snapshot'

const log = logger('aggregate')

@injectable()
export class AbstractAggregateRepository<A extends Aggregate> {

  constructor (protected eventStore: EventStore, protected snapshotStrategy: SnapshotStrategy) {

  }

  public async findOne (aggregateId: string): Promise<A> {
    let snapshot
    let revision: number | undefined
    let aggregateType
    let context
    if (!this.getConfig().noSnapshot) {
      snapshot = await this.snapshotStrategy.findOne(aggregateId)
      if (snapshot) {
        log.info(`Found Snapshot for ${aggregateId}`)
        revision = snapshot.revision
        aggregateType = snapshot.aggregateType
        context = snapshot.context
      }
    }
    const events = await this.eventStore.query(aggregateId, revision)
    if (events && events.length > 0) {
      aggregateType = events[0].aggregateType
      context = events[0].context
    }
    const agg: AbstractAggregate = new (this.getConfig().aggregate)()
    if (this.getAggregateConfig(agg).name !== aggregateType || this.getAggregateConfig(agg).context !== context) {
      throw badRequest(`Invalid event applied to aggregate.\
      Received: ${context}.${aggregateType}.\
      Expected: ${this.getAggregateConfig(agg).context}.${this.getAggregateConfig(agg).name}`)
    }
    agg._commitedEvents = events
    if (snapshot) {
      agg.attributes = snapshot.attributes
      agg.aggregateId = snapshot.aggregateId
    }
    events.forEach(e => agg.apply(e, true))
    agg._uncomittedEvents = []
    return agg as any
  }

  // public async find (): Promise<Array<A>> {
  //   let agg: A = new this.type()
  //   let events = await this.eventStore.find(agg.aggregateType)
  //   if (events.length === 0) {
  //     return []
  //   }
  //   let aggregates: Array<A> = []
  //   let currentAggregateId: string | undefined = undefined
  //   let aggregateEvents: Array<Event> = []
  //   log.debug(`Have ${events.length} events for ${agg.aggregateType}`)
  //   while (events.length >= 0) {
  //     let event = events.shift() as Event
  //     if (!event || currentAggregateId !== event.aggregateId) {
  //       if (aggregateEvents.length > 0) {
  //         agg = new this.type()
  //         aggregateEvents.sort((a: any, b: any) => a.version - b.version).forEach(e => agg.on(e))
  //         aggregates.push(agg)
  //       }
  //       if (!event) {
  //         break
  //       }
  //       currentAggregateId = event.aggregateId
  //       aggregateEvents = []
  //     }
  //     aggregateEvents.push(event)
  //   }
  //   log.debug(`Resolved to ${aggregates.length} aggregates`)
  //   return aggregates
  // }

  public async commit (a: A): Promise<void> {
    const aggregate: AbstractAggregate = (a as any)
    if (aggregate._uncomittedEvents.length === 0) {
      log.info('Events emtpy. nothingt to commit')
      return
    }
    // let validation = t.validate(event, handler.type)
    // try {
    //   ThrowReporter.report(validation)
    // } catch (e) {
    //   log.info(`Event validation failed. Cancel commit`)
    //   log.info(Utils.tryStringifyJson(PathReporter.report(validation)) || 'Could not parse event validation')
    //   throw new Error(`Event Validation failed`)
    // }
    if (!this.getConfig().noSnapshot && await this.snapshotStrategy.isSnapshotRequired(aggregate._commitedEvents)) {
      log.info(`Has ${aggregate._commitedEvents.length} commited events. Snapshot required`)
      await this.snapshotStrategy.storeSnapshot({
        aggregateId: aggregate.aggregateId,
        aggregateType: this.getAggregateConfig(aggregate).name,
        context: this.getAggregateConfig(aggregate).context,
        revision: (aggregate._commitedEvents.slice(-1).pop() as Event).revision as number,
        committedAt: new Date(),
        attributes: aggregate.attributes
      })
    } else {
      log.debug(`No Snapshot required. Commited event count: ${aggregate._commitedEvents ? aggregate._commitedEvents.length : 0}`)
    }
    let nextRevision = 0
    if (aggregate._commitedEvents && aggregate._commitedEvents.length > 0) {
      nextRevision = ((aggregate._commitedEvents.slice(-1).pop() as Event).revision || 0)
    }
    const requestContext = CONTEXT()
    for (const e of aggregate._uncomittedEvents) {
      nextRevision++
      e.revision = nextRevision
      e.aggregateType = this.getAggregateConfig(aggregate).name
      e.context = this.getAggregateConfig(aggregate).context
      e.meta = {
        ...(e.meta || {}),
        identity: requestContext ? requestContext.identity : undefined,
        correlationId: requestContext ? requestContext.correlationId : undefined
      }
    }

    await this.eventStore.putBatch(aggregate._uncomittedEvents)

    aggregate._commitedEvents = [
      ...(aggregate._commitedEvents || []),
      ...aggregate._uncomittedEvents
    ]

    aggregate._uncomittedEvents = []
  }

  protected getConfig () {
    return Reflect.getMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE_REPOSITORY, this) as AggregateRepositoryDecorator<any>
  }

  protected getAggregateConfig (aggregate: AbstractAggregate) {
    return Reflect.getMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE, aggregate) as AggregateDecorator
  }

}

export interface AggregateRepository<A extends Aggregate> {
  findOne (aggregateId: string): Promise<A>
  commit (aggregate: A): Promise<void>
}

export interface AggregateRepositoryDecorator<A extends Aggregate> {
  aggregate: Newable<A>
  noSnapshot?: boolean
  noValidate?: boolean
}

export function aggregateRepository (value: AggregateRepositoryDecorator<any>) {
  return function (target: any) {
    if (!value.aggregate) {
      throw new Error('Aggregate type not provided')
    }
    const config = {
      ...value
    }
    // applyMixins(target, [AbstractAggregateRepository])
    Reflect.defineMetadata(AGGREGATE_REFLECT_KEYS.AGGREGATE_REPOSITORY, config, target.prototype)
    return makeInjectable(target)
  }
}
