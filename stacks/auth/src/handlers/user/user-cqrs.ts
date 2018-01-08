import '@eventstorejs/request'
import { CqrsModule, cqrsHandler, cqrsEventHandler, CqrsHandler, CqrsContext } from '@eventstorejs/cqrs'

import * as User from '../../api/user'

@cqrsHandler({
  name: 'user-cqrs',
  imports: [
    CqrsModule
  ]
})
export default class UserCqrsHandler implements CqrsHandler {

  constructor () {

  }

  @cqrsEventHandler({ type: User.CreatedEvent })
  async onUserCreated (event: User.CreatedEvent, context: CqrsContext) {
    // console.log(event)
  }

}
