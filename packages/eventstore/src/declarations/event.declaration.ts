import * as t from 'io-ts'
import { Event } from '../definitions'
import { optional } from '@eventstorejs/api-builder'

// export interface EventWithPayload<P> extends Event {
//   payload: P
// }

// export interface EventDeclaration<P> {
//   type: t.Type<EventWithPayload<P>>
//   factory: EventFactory<P>
// }

// export interface EventFactory<P> {
//   (p: P): EventWithPayload<P>
// }

export interface EventAssociation {
  name: string,
  aggregateType: string,
  context: string
}

export function event<P> (options: EventAssociation, payload: t.Type<P>) {
  if (!options || !options.name || !options.aggregateType || !options.context) {
    console.warn(`Invalid event:`, options)
    throw new Error(`Invalid event defintion supplied`)
  }
  let type = t.intersection([Event, optional({
    name: t.literal(options.name),
    payload : payload
  }, {
    aggregateType: t.literal(options.aggregateType),
    context: t.literal(options.context),
  })], options.name);
  (type as any)._association = options
  return type
  // if (payload) {
  //   intersectionTypes.push(t.interface({
  //     name: t.literal(name),
  //     payload
  //   }))
  // } else {
  //   intersectionTypes.push(t.interface({
  //     name: t.literal(name),
  //     payload: t.undefined
  //   }))
  // }
  // return t.intersection(intersectionTypes)
}

export function isEvent (event: Event, type: t.Type<Event>) {
  return t.is(event, type)
}
