import { CloudWatch } from 'aws-sdk'
import { strEnum } from '@eventstorejs/core'

import { CONTEXT } from '../utils'
import { serializeError } from './error.logger'

export const LogLevel = strEnum([
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR'
])

export type LogLevel = keyof typeof LogLevel

export class Logger {

  constructor (public namespace: string) {

  }

  debug (message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info (message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn (message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error (message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data)
  }

  metric (name: string, value: CloudWatch.DatapointValue, unit: CloudWatch.StandardUnit) {
    console.log(JSON.stringify({
      level: 'METRIC',
      namespace: this.namespace,
      name,
      value,
      unit
    }))
  }

  log (level: LogLevel, message: string, data?: any) {
    const context = CONTEXT()
    let payload = data
    if (data instanceof Error) {
      payload = serializeError(data)
    }
    console.log(JSON.stringify({
      level,
      namespace: this.namespace,
      message,
      correlationId: context ? context.correlationId : undefined,
      payload
    }))
  }
}

export function logger (namespace: string) {
  return new Logger(namespace)
}
