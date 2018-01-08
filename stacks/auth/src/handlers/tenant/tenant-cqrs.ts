import '@eventstorejs/request'
import { CqrsModule, cqrsHandler, cqrsEventHandler, CqrsHandler, CqrsContext } from '@eventstorejs/cqrs'

import * as Tenant from '../../api/tenant'

@cqrsHandler({
  name: 'tenant-cqrs',
  imports: [
    CqrsModule
  ]
})
export default class UserCqrsHandler implements CqrsHandler {

  constructor () {

  }

  @cqrsEventHandler({ type: Tenant.CreatedEvent })
  async onTenantCreated (event: Tenant.CreatedEvent, context: CqrsContext) {
    // console.log(event)
  }

}
