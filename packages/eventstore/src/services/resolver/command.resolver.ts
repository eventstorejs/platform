import { injectable } from 'inversify'

export interface CommandRegistration {
  name: string
  context: string
  lambdaArn: string
  validUntil?: Date
  deployedAt: Date
}

@injectable()
export abstract class CommandResolver {

  abstract resolve (request: {name: string, context: string}): Promise<CommandRegistration>

}
