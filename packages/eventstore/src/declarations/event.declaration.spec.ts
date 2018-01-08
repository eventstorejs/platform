import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'

import { event, isEvent } from './event.declaration'
import { optional } from '@eventstorejs/api-builder'

const TestEvent = event({
  name: 'BLUB',
  aggregateType: 'test',
  context: 'context'
}, t.interface({
  known: t.string
}))

test('event matcher', async () => {
  let event = {
    name: 'BLUB',
    aggregateType: 'test',
    context: 'context',
    payload: {
      known: 'any'

    }
  }

  expect(isEvent(event, TestEvent)).toBe(true)
  expect(isEvent({} as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test' } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true' } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'asdf', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { known: 1 } } as any, TestEvent)).toBe(false)

})

export const Address = optional({}, {
  street: t.string,
  houseNo: t.string,
  city: t.string,
  zip: t.string
})

export const Place = optional({
  name: t.string,
  address: Address,
  regionId: t.string
}, {
  tenant: t.string
})
export const CreatedEvent = event({ name: 'CREATED', aggregateType: 'place', context: 'training' }, Place)

test('test palce...', async () => {
  let event = {
    aggregateId: '23b314bd-c204-454f-a099-e3412a407478',
    name: 'CREATED',
    aggregateType: 'place',
    revision: 1,
    context: 'training',
    payload: { name: 'Test', address: {}, regionId: 'dada' },
    meta : undefined
  }

  expect(isEvent(event, CreatedEvent)).toBe(true)
  expect(isEvent({} as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test' } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true' } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'asdf', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { unknown: 'blub' } } as any, TestEvent)).toBe(false)
  expect(isEvent({ name: 'BLUB', aggregateType: 'test', context: 'true', payload: { known: 1 } } as any, TestEvent)).toBe(false)

})
