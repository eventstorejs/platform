import { parseJson, stringifyJson } from '@eventstorejs/core'

export function sanitizeRequest (object: any) {
  if (!object) {
    return object
  }
  try {
    return parseJson(stringifyJson(object))
  } catch (e) {
    return object
  }
}

export function done (statusCode: number, body?: any) {
  return {
    statusCode,
    body: body ? stringifyJson(body) : undefined
  }
}
