import { ContainerModule, interfaces } from 'inversify'

import { ICALService, ICAL } from './services'

export const CalendarModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<ICALService>(ICALService).to(ICALService).inSingletonScope()
  bind<any>(ICAL).toConstantValue(require('ical-generator'))
})
