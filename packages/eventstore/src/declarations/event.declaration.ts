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
export interface EventNamespaceFactoryOptions {
  aggregateType: string,
  context: string
}

export function eventNamespaceFactory (options: EventNamespaceFactoryOptions) {
  return <P>(name: string, payload: t.Type<P>) => {
    if (!options || !options.aggregateType || !options.context) {
      console.warn(`Invalid event:`, options)
      throw new Error(`Invalid event defintion supplied`)
    }
    const type = t.intersection([Event, optional({
      name: t.literal(name),
      payload: payload
    }, {
      aggregateType: t.literal(options.aggregateType),
      context: t.literal(options.context)
    })], name);
    (type as any)._association = options
    return type
  }
}

export interface EventAssociation {
  name: string,
  aggregateType: string,
  context: string
}

export function event<P> (options: EventAssociation, payload: t.Type<P>) {
  console.warn(`Using deprecated event builder`)
  if (!options || !options.name || !options.aggregateType || !options.context) {
    console.warn(`Invalid event:`, options)
    throw new Error(`Invalid event defintion supplied`)
  }
  const type = t.intersection([Event, optional({
    name: t.literal(options.name),
    payload : payload
  }, {
    aggregateType: t.literal(options.aggregateType),
    context: t.literal(options.context)
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
