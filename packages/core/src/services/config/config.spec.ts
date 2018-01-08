import 'reflect-metadata'
import 'jest'

// import { Mock, It, Times } from 'typemoq'
import { Config } from './config'

test('resolve env variable', async () => {
  let key = Math.random().toString(36)
  let value = 'SOME_VALUE'
  let c = new Config({
    [key]: value
  })
  expect(await c.resolve<string>(key)).toBe(value)
  expect(await c.resolve<string>(key)).toBe(value)
})

test('use default on missing', async () => {
  let c = new Config({
    SOMETHING_OTHER: 'NTO_FOUND'
  })
  let key = Math.random().toString(36)
  let value = 'SOME_VALUE'
  expect(await c.resolve<string>(key, value)).toBe(value)
})

test('test resolve with promise initilaizer', async () => {
  let c = new Config(Promise.resolve({
    SOMETHING_OTHER: 'NTO_FOUND'
  }))
  expect(await c.resolve<string>('SOMETHING_OTHER')).toBe('NTO_FOUND')
})

test('test resolve with promise and sync init', async () => {
  let c = new Config([Promise.resolve({
    SOMETHING_OTHER: 'NTO_FOUND'
  }), {'SOME_OTHER' : 'VALUE'}])
  expect(await c.resolve<string>('SOMETHING_OTHER')).toBe('NTO_FOUND')
  expect(await c.resolve<string>('SOME_OTHER')).toBe('VALUE')
})

test('not found and no default', async () => {
  let c = new Config({})
  let key = Math.random().toString(36)
  expect(await c.resolve<string>(key)).toBeUndefined()
})
