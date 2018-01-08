
import '@eventstorejs/request'

import { handler, RequestHandler, Context } from '@eventstorejs/request'
import { SchedulerService, SchedulerStackModule, TriggerAggregateRepository } from '../../lib'
import * as Trigger from '../../api/trigger'

// const log = logger('Garage.command-handler')
@handler({
  name: 'timer',
  timeout: 300,
  events: [{
    schedule: {
      rate: 'rate(5 minutes)'
    }
  }],
  imports: [
    SchedulerStackModule
  ]
})
export default class TimerHandler implements RequestHandler<any> {

  constructor (private scheduler: SchedulerService, private triggerRepo: TriggerAggregateRepository) {

  }

  async handle (_event: any, _context: Context): Promise<void> {
    const triggers = await this.scheduler.getTriggersToEmit()
    for (const t of triggers) {
      const trigger = await this.triggerRepo.findOne(t.triggerId)
      trigger.apply({
        name: Trigger.TriggeredEvent.name,
        payload: {}
      })
      await this.triggerRepo.commit(trigger)
      const res = await this.scheduler.updateNextTriggers([{
        trigger: trigger.attributes.trigger as Trigger.CronTrigger | Trigger.TimedTrigger,
        triggerId: trigger.aggregateId
      }])
      if (res.deleted.length > 0) {
        trigger.apply({
          name: Trigger.TriggerExpired.name,
          payload: {}
        })
        await this.triggerRepo.commit(trigger)
      }
    }

  }

}
