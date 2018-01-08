
import { Translation } from '@eventstorejs/translate'

export function i18n (key: string, params?: { i18n?: Translation }) {
  if (!params || !params.i18n) {
    throw new Error(`Using i18n but no translation provided`)
  }
  return params.i18n.get(key, params)
}
