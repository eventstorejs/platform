import * as t from 'io-ts'
import { Command } from '../definitions'

export function command (name: string, context: string, payload?: t.Type<any>) {
  console.warn(`Using deprecated command creation`)
  return t.intersection([Command, t.interface({
    name: t.literal(name),
    context: t.literal(context),
    payload: payload || t.undefined
  })], name)
}

export interface CommandNamespaceFactoryOptions {
  context: string
  category: string
}

export function commandNamespaceFactory (options: CommandNamespaceFactoryOptions) {
  return <P>(name: string, payload: t.Type<P>) => {
    if (!options || !options.context || !options.category) {
      console.warn(`Invalid command:`, options)
      throw new Error(`Invalid command defintion supplied`)
    }
    const commandName = `${options.category}.${name}`
    return t.intersection([Command, t.interface({
      name: t.literal(commandName),
      context: t.literal(options.context),
      payload: payload || t.undefined
    })], commandName)
  }
}
