import 'jest'
import 'reflect-metadata'
import { install } from 'source-map-support'
install()

import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
import { optional } from './types'

const TestIntf = optional({
  foo: t.number,
  baz: t.string
}, {
  bar: t.string
})

test('something', async () => {
  let testing: t.TypeOf<typeof TestIntf> = {
    foo: 1,
    baz: '1212'
  }

  expect(() => ThrowReporter.report(t.validate(testing, TestIntf))).not.toThrow()

  // These should not throw errors
  expect(() => ThrowReporter.report(t.validate({ foo: 123, bar: 'abc', baz: 'xyz' }, TestIntf))).not.toThrow()
  expect(() => ThrowReporter.report(t.validate({ foo: 123, baz: 'xyz' }, TestIntf))).not.toThrow()

  // These should throw errors
  expect(() => ThrowReporter.report(t.validate({ foo: 'abc', baz: 'xyz' }, TestIntf))).toThrow()
  expect(() => ThrowReporter.report(t.validate({ foo: 123, baz: 123 }, TestIntf))).toThrow()
  expect(() => ThrowReporter.report(t.validate({ foo: 'abc', baz: 'xyz' }, TestIntf))).toThrow()
  expect(() => ThrowReporter.report(t.validate({ foo: 'abc' }, TestIntf))).toThrow()
  expect(() => ThrowReporter.report(t.validate({}, TestIntf))).toThrow()
})
