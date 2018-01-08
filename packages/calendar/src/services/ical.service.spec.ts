// import { Mock } from 'typemoq'
const ical = require ('ical-generator')

// import { Config } from '@eventstorejs/core'
import { ICALService } from './ical.service'

test('test create ics', async () => {
  const service = new ICALService(ical)
  expect(service.createEvent({
    start: new Date()
  })).toBeDefined()

})

test('test create ics with alarm', async () => {
  const service = new ICALService(ical)
  expect(service.createEvent({
    start: new Date(),
    alarms: [{type: 'display', trigger: 5}]
  })).toBeDefined()

})
