import { isNumber, isNaN, isUndefined, isNull } from 'lodash'

export function incHelper (input?: number): number | undefined {
  if (isUndefined(input) || isNull(input)) {
    return input
  }
  let parsed = input
  if (!isNumber(input)) {
    parsed = parseInt(input, undefined)
  }
  if(isNaN(parsed)) {
    throw new Error(`Could not parse ${input} as number`)
  }
  return parsed + 1
}
