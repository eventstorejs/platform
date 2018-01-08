import { tryStringifyJson } from '@eventstorejs/core'
import { lambdaVersion, logMessage, serviceName, handlerName, parseFloatWith, isTimeoutMessage } from './parse-log'

import { publishMetrics } from './metrics'

export async function processAll (logGroup: string, logStream: string, logEvents: Array<any>) {
  const lambdaVer = lambdaVersion(logStream)
  const service = serviceName(logGroup)
  const handler = handlerName(logGroup)
  const namespace = `${service}/${handler}`
  const stage = process.env.STAGE || 'dev'

  const dimensions = [
    { Name: 'FunctionName', Value: namespace },
    { Name: 'FunctionVersion', Value: lambdaVer }
  ]

  let metrics: Array<any> = []

  for (const logEvent of logEvents) {
    const log = logMessage(logEvent.message) as any
    log.level = log.level || 'DEBUG'
    log.service = service
    log.handler = handler
    log.logStream = logStream
    log.logGroup = logGroup
    log.lambdaVersion = lambdaVer
    log.fields = log.fields || {}
    log.timestamp = new Date(logEvent.timestamp)

    if (log.type === 'SYS') {
      if (log.message.startsWith('REPORT RequestId:')) {
        const parts = log.message.split('\t', 5)

        const billedDuration = parseFloatWith(/Billed Duration: (.*) ms/i, parts[2])
        const memorySize = parseFloatWith(/Memory Size: (.*) MB/i, parts[3])
        const memoryUsed = parseFloatWith(/Max Memory Used: (.*) MB/i, parts[4])
        if (process.env.PUBLISH_METRICS) {
          metrics = [
            ...metrics,
            { value: billedDuration, unit: 'Milliseconds', name: 'BilledDuration', dimensions, timestamp: new Date() },
            { value: memorySize, unit: 'Megabytes', name: 'MemorySize', dimensions, timestamp: new Date() },
            { value: memoryUsed, unit: 'Megabytes', name: 'MemoryUsed', dimensions, timestamp: new Date() }
          ]
        }
      } else if (isTimeoutMessage(log.message)) {
        log.level = 'ERROR'
        log.isTimeout = true
        log.message = log.message.substr(log.message.indexOf('Task'))
        if (process.env.PUBLISH_METRICS) {
          // let timedOutAfter: number = 60000
          metrics.push({ value: 1, unit: 'Count', name: 'TimeOut', dimensions, timestamp: new Date() })
        }
      }
    }

    if (log.level === 'METRIC') {
      if (process.env.PUBLISH_METRICS) {
        metrics.push(logEvent)
      } else {
        console.log(`[METRIC] [${namespace}] Name: ${log.name} Value: ${log.value} ${log.unit}`)
      }
    } else if (log.level !== 'DEBUG') {
      console.log(`[${log.level}] [${log.correlationId}] [${namespace}.${log.namespace || 'default'}] ${log.message} ${log.payload ? `\n` : ''} ${tryStringifyJson(log.payload) || ''}`)
    }

    if (log.level === 'ERROR' && !log.isTimeout) {
      if (process.env.PUBLISH_METRICS) {
        metrics.push({ value: 1, unit: 'Count', name: 'InternalError', dimensions, timestamp: new Date() })
      }
    }
  }

  if (metrics.length > 0) {
    await publishMetrics(metrics, stage)
  }

}
