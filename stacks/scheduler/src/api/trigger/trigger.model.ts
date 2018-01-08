import * as t from 'io-ts'
import { DateType, optional } from '@eventstorejs/api-builder'

export const Trigger = t.interface({

})

export type Trigger = t.TypeOf<typeof Trigger>

export const CronTrigger = t.intersection([Trigger, optional({
  cron: t.string
}, {
  lastExecution: DateType
})])

export type CronTrigger = t.TypeOf<typeof CronTrigger>

export const TimedTrigger = t.intersection([Trigger, t.interface({
  date: DateType
})])

export type TimedTrigger = t.TypeOf<typeof TimedTrigger>
