import { getNamespace, Namespace } from 'continuation-local-storage'
import { Context } from '../definitions'
export const REQUEST_NAMSPACE_KEY = '__CURRENT_REQUEST__'

export const REQUEST_KEYS = {
  REQUEST: '__REQUEST__',
  CONTEXT: '__CONTEXT__'
}

export const REQUEST_NAMESPACE = (): Namespace => {
  return getNamespace(REQUEST_NAMSPACE_KEY)
}

export const REQUEST = (): any | undefined => {
  try {
    return REQUEST_NAMESPACE().get(REQUEST_KEYS.REQUEST)
  } catch (e) {
    return undefined
  }
}

export const CONTEXT = (): Context | undefined => {
  try {
    return REQUEST_NAMESPACE().get(REQUEST_KEYS.CONTEXT)
  } catch (e) {
    return undefined
  }
}
