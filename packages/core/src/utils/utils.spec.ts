import 'reflect-metadata'
import 'jest'

// import { Mock, It, Times } from 'typemoq'
import { Utils } from './utils'

test('test restore date as date', async () => {
  let date = new Date()
  let input = {
    key1: 'HELLO',
    dateKey: date
  }
  let serialized = Utils.stringifyJson(input)
  let deserialized = Utils.parseJson<any>(serialized)
  expect(deserialized).toBeDefined()
  expect(deserialized.key1).toBe('HELLO')
  expect(deserialized.dateKey).toBeInstanceOf(Date)
  expect(deserialized.dateKey.getTime()).toBe(date.getTime())
})
