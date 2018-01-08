import { METADATA_KEY } from 'inversify'

export function makeInjectable (target: any, name: string = 'this') {
  if (Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, target)) {
    throw new Error(`Already annotated as injectable. Using ${name} makes annotating with injectable not required anymore`)
  }

  const types = Reflect.getMetadata(METADATA_KEY.DESIGN_PARAM_TYPES, target) || []
  Reflect.defineMetadata(METADATA_KEY.PARAM_TYPES, types, target)

  return target
}
