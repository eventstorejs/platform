import { isString, isNumber } from 'lodash'
import { tryStringifyJson } from '@eventstorejs/core'

// const CHARACTERS = ['&', '%', '$', '#', '_', '{', '}', '~', '^', '\\']

const CHARACTERS_REGEX = /[\&\%\$\#\_\{\}\~\^\\]/g

export function latexEscape (input?: string): string | undefined {
  if (!input) {
    return input
  }
  if (isNumber(input)) {
    return input
  }
  if (!isString(input)) {
    throw new Error(`Can only escape characters in string. Received: ${tryStringifyJson(input)}`)
  }
  return input.replace(CHARACTERS_REGEX, '\\$&').trim()
}
