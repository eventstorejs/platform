import '@eventstorejs/request'

import { Context } from '@eventstorejs/request'
import { badRequest } from 'boom'
import { UserService, hasRole, Role, setTenant, AuthService } from '@eventstorejs/identity'
import { commandHandler, CommandRequestHandler, commandEventHandler } from '@eventstorejs/eventstore'
import { AuthStackModule, UserAggregateRepository, UserAggregate } from '../../lib'

import * as User from '../../api/user'

// const log = logger('Garage.command-handler')
@commandHandler({
  name: 'user',
  context: 'auth',
  imports: [
    AuthStackModule
  ]
})
export default class UserCommandHandler implements CommandRequestHandler {

  constructor (private userService: UserService, private userRepo: UserAggregateRepository) {

  }

  @commandEventHandler({
    type: User.CreateCommand
  })
  @hasRole([Role.Admin, Role.Manager])
  async handleUserCreated (command: User.CreateCommand, context: Context) {
    let user = new UserAggregate()
    let tenant = setTenant(context, command.payload.tenant)
    if (!tenant) {
      throw badRequest(`Could not resolve tenant`)
    }
    if (AuthService.hasRole(command.payload.roles, Role.Admin) && (!context.identity || !context.identity.isAdmin)) {
      throw badRequest(`Only admins can create admins`)
    }
    await this.userService.createUser({
      email: command.payload.email,
      username: command.payload.username,
      roles: command.payload.roles || [],
      tenant: tenant,
      password: command.payload.password
    })
    user.apply({
      name: User.CreatedEvent.name,
      payload: {
        email: command.payload.email,
        username: command.payload.username,
        roles: command.payload.roles || [],
        tenant: tenant
      }
    })
    await this.userRepo.commit(user)
  }

}
