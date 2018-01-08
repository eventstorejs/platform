import { tryParseJson } from '@eventstorejs/core'
import { isObject } from 'lodash'

// logGroup looks like this:
//    "logGroup": "/aws/lambda/service-env-funcName"
export function functionName (logGroup: string): string {
  return logGroup.split('/').reverse()[0]
}

// logStream looks like this:
//    "logStream": "2016/08/17/[76]afe5c000d5344c33b5d88be7a4c55816"
export function lambdaVersion (logStream: string) {
  const start = logStream.indexOf('[')
  const end = logStream.indexOf(']')
  return logStream.substring(start + 1, end)
}

export function serviceName (logGroup: string) {
  const fullName = functionName(logGroup)
  return fullName.split(`-${process.env.STAGE}-`)[0]
}

export function handlerName (logGroup: string) {
  const fullName = functionName(logGroup)
  return fullName.split(`-${process.env.STAGE}-`)[1]
}

export function parseFloatWith (regex: RegExp, input: string) {
  const res = regex.exec(input) as any
  return parseFloat(res[1])
}

const requestIdFromSysLog = (message: string) => {
  const idx = message.indexOf('RequestId: ')

  // funny, JS string has multiple substring methods..
  // substr takes starting index & length
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr
  // NOTE: "RequestId: " is 11 chars long, hence `+ 11` below, and request ID is
  // always a 36 char guid
  return message.substr(idx + 11, 36)
}

const isDate = function (str: string) {
  return !isNaN(Date.parse(str))
}

export function isTimeoutMessage (message: string) {
  return message.indexOf('Task timed out after') >= 0
}

// a typical API Gateway log message looks like this:
//    "2017-04-26T10:41:09.023Z	db95c6da-2a6c-11e7-9550-c91b65931beb\tloading index.html...\n"
// but there are START, END and REPORT messages too:
//    "START RequestId: 67c005bb-641f-11e6-b35d-6b6c651a2f01 Version: 31\n"
//    "END RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\n"
//    "REPORT RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\tDuration: 1095.52 ms\tBilled Duration: 1100 ms \tMemory Size: 128 MB\tMax Memory Used: 32 MB\t\n"
export function logMessage (message: string) {
  let type
  if (message.startsWith('START RequestId') ||
    message.startsWith('END RequestId') ||
    isTimeoutMessage(message) ||
    message.startsWith('REPORT RequestId')) {
    type = 'SYS'
  } else {
    type = 'LOG'
  }

  if (type === 'SYS') {
    const requestId = requestIdFromSysLog(message)
    return {
      level: 'DEBUG',
      type,
      fields: {},
      requestId,
      message
    }
  }

  const parts = message.split('\t', 3)

  const parsed = tryParseJson(parts[2])
  if (isObject(parsed)) {
    return parsed
  }

  // likely API Gateway log message
  if (parts.length === 3 && isDate(parts[0])) {
    const timestamp = parts[0]
    const requestId = parts[1]
    const logMessage = parts[2]

    return {
      level: 'DEBUG',
      message: logMessage,
      fields: {
        timestamp,
        requestId
      }
    }
  }

  return {
    level: 'ERROR',
    message: message
  }
}
