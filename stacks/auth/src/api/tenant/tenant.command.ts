import * as t from 'io-ts'
import { command } from '@eventstorejs/eventstore'

export type Commands
  = CreateCommand
  | AddFeatureCommand
  | RemoveFeatureCommand

export const CATEGORY = 'tenant'

export const CreateCommand = command(`${CATEGORY}.CREATE`, 'auth', t.interface({
  name: t.string
}))

export type CreateCommand = t.TypeOf<typeof CreateCommand>

export const AddFeatureCommand = command(`${CATEGORY}.ADD_FEATURE`, 'auth', t.interface({
  feature: t.string
}))

export type AddFeatureCommand = t.TypeOf<typeof AddFeatureCommand>

export const RemoveFeatureCommand = command(`${CATEGORY}.REMOVE_FEATURE`, 'auth', t.interface({
  feature: t.string
}))

export type RemoveFeatureCommand = t.TypeOf<typeof RemoveFeatureCommand>
