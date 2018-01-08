import '@eventstorejs/request'

import { commandHandler, CommandRequestHandler, commandEventHandler } from '@eventstorejs/eventstore'
import * as Trigger from '../../api'
import { SchedulerService, SchedulerStackModule, TriggerAggregate, TriggerAggregateRepository } from '../../lib'

// const log = logger('Garage.command-handler')
@commandHandler({
  name: 'trigger',
  context: 'scheduler',
  imports: [
    SchedulerStackModule
  ]
})
export default class TriggerCommandHandler implements CommandRequestHandler {

  constructor (private scheduler: SchedulerService, private triggerRepo: TriggerAggregateRepository) {

  }

  @commandEventHandler({
    type: Trigger.SetCommand
  })
  async setTrigger (command: Trigger.SetCommand) {
    let trigger = new TriggerAggregate()
    trigger.apply({
      name: Trigger.SetEvent.name,
      aggregateId: command.aggregateId,
      payload: command.payload
    })
    await this.scheduler.setTrigger({
      trigger: command.payload,
      triggerId: trigger.aggregateId
    })
    await this.triggerRepo.commit(trigger)
    return {
      aggregateId: trigger.aggregateId
    }
  }

  @commandEventHandler({
    type: Trigger.UpdateCommand
  })
  async updateTrigger (command: Trigger.UpdateCommand) {
    let trigger = await this.triggerRepo.findOne(command.aggregateId as string)
    trigger.apply({
      name: Trigger.UpdatedEvent.name,
      payload: command.payload
    })
    await this.scheduler.setTrigger({
      trigger: command.payload,
      triggerId: trigger.aggregateId
    })
    await this.triggerRepo.commit(trigger)
    return {
      aggregateId: trigger.aggregateId
    }
  }

  @commandEventHandler({
    type: Trigger.CancelCommand
  })
  async cancelTrigger (command: Trigger.CancelCommand) {
    let trigger = await this.triggerRepo.findOne(command.aggregateId as string)
    trigger.apply({
      name: Trigger.CanceledEvent.name,
      payload: command.payload
    })
    await this.scheduler.cancelTrigger(trigger.aggregateId)
    await this.triggerRepo.commit(trigger)
    return {
      aggregateId: trigger.aggregateId
    }
  }

}
