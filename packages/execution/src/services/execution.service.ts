import { injectable, inject } from 'inversify'
import { isString } from 'lodash'
import { Lambda, SNS } from 'aws-sdk'
import { create } from 'boom'
import { Config, Utils } from '@eventstorejs/core'
import { LAMBDA_TOKEN, SNS_TOKEN } from '@eventstorejs/aws'
import { logger } from '@eventstorejs/request'
import { ExecutionResult } from '../definitions'

const log = logger('execution')

export interface InvokeLambdaRequest {
  lambdaArn?: string
  name?: string
  payload?: any
}

export interface DispatchRequest {
  topicArn?: string
  name?: string
  payload?: any
}

@injectable()
export class ExecutionService {

  constructor (
    @inject(Config) private config: Config,
    @inject(LAMBDA_TOKEN) private lambda: Lambda,
    @inject(SNS_TOKEN) private sns: SNS
  ) {
  }

  async invoke<T> (request: InvokeLambdaRequest): Promise<ExecutionResult<T>> {
    const lambdaArn = await this.resolveLambdaName(request)
    log.info(`Execution lambda ${lambdaArn}`)
    const start = Date.now()
    const res = await this.lambda.invoke({
      FunctionName: lambdaArn,
      Payload: Utils.tryStringifyJson(request.payload)
    }).promise()
    log.debug(`Execution of ${lambdaArn} finished in ${Date.now() - start} millis`)
    let statusCode = res.StatusCode
    let response = Utils.tryParseJson<any>(res.Payload)
    if (response && response.errorMessage) {
      response = Utils.tryParseJson<any>(response.errorMessage)
    }
    if (response && response.body) {
      response.body = Utils.tryParseJson<any>(response.body)
    }
    if (response && response.statusCode) {
      statusCode = response.statusCode
    }
    if (statusCode) {
      if (statusCode >= 400) {
        log.debug(`Lambda ${lambdaArn} returned an error status code ${statusCode}`)
        throw create(response.statusCode, response.message, {
          ...response.data
        })
        // throw new ExecutionFailedError(response.type, response.message, response.statusCode)
      } else {
        log.debug(`Lambda ${lambdaArn} returned success code ${statusCode}`)
      }
    } else {
      log.warn(`Non StatusCode Response received`)
    }
    return response
  }

  async invokeAsync (request: InvokeLambdaRequest) {
    const lambdaArn = await this.resolveLambdaName(request)
    log.info(`Execution lambda ${lambdaArn}`)
    await this.lambda.invoke({
      FunctionName: lambdaArn,
      InvocationType: 'Event',
      Payload: Utils.stringifyJson(request.payload)
    }).promise()
  }

  async dispatch (request: DispatchRequest) {
    let topicArn
    if (request.topicArn) {
      topicArn = request.topicArn
    } else {
      const topicName = `${await this.config.resolve('SNS_PREFIX')}${request.name}`
      topicArn = `arn:aws:sns:${await this.config.resolve('REGION')}:${await this.config.resolve('ACCOUNT_ID')}:${topicName}`
    }
    log.info(`Publishing topic ${topicArn}`)
    await this.sns.publish({
      Message: !request.payload || isString(request.payload) ? request.payload : Utils.stringifyJson(request.payload),
      TopicArn: topicArn
    }).promise()
  }

  async list (): Promise<Array<any>> {
    log.debug(`Resolving available lambda functions`)
    const res = await this.lambda.listFunctions({

    }).promise()
    if (!res.Functions) {
      log.warn(`No functiosn resolved`)
      return []
    }
    log.debug(`Have ${res.Functions.length}`)
    return res.Functions.map(f => ({ name: f.FunctionName }))
  }

  async resolveLambdaName (request: InvokeLambdaRequest) {
    if (request.lambdaArn) {
      return request.lambdaArn
    }
    return `${await this.config.resolve('SERVICE')}-${await this.config.resolve('STAGE')}-${request.name}`
  }

  async normalizeLambdaName (lambda: string): Promise<string> {
    return lambda.replace(`${await this.config.resolve<string>('SERVICE')}-${await this.config.resolve<string>('STAGE')}-`, '')
  }

}
