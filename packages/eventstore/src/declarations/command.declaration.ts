import * as t from 'io-ts'
import { Command } from '../definitions'

export function command (name: string, context: string, payload?: t.Type<any>) {
  return t.intersection([Command, t.interface({
    name: t.literal(name),
    context: t.literal(context),
    payload: payload || t.undefined
  })], name)
}
