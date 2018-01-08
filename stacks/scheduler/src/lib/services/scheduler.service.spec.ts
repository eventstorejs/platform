import { SchedulerService } from './scheduler.service'

test('cron expression with date in the past', async () => {
  let scheduler = new SchedulerService(null as any, null as any)

  let nextDate = scheduler.getNextTrigger({
    cron: '* * * * *',
    lastExecution: new Date('Wed, 26 Dec 2012 14:40:00 UTC')
  })
  expect(nextDate).not.toBeDefined()
})

test('next day cron expression', async () => {
  let scheduler = new SchedulerService(null as any, null as any)

  let nextDate = scheduler.getNextTrigger({
    cron: '0 */10 * * * *'
  })
  // console.log(nextDate)
  expect(nextDate).toBeInstanceOf(Date)

})
