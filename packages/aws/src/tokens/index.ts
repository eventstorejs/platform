
import { SSM, S3, DynamoDB, CognitoIdentityServiceProvider, Lambda, SNS } from 'aws-sdk'

export const SSM_TOKEN = Symbol.for('AWS SSM')

export function SSM_FACTORY () {
  return new SSM()
}

export const S3_TOKEN = Symbol.for('AWS S3')

export function S3_FACTORY () {
  return new S3()
}

export const DYNAMO_TOKEN = Symbol.for('AWS DynamoDB')

export function DYNAMO_FACTORY () {
  return new DynamoDB.DocumentClient()
}

export const COGNITO_IDENTITY_TOKEN = Symbol.for('AWS CognitoIdentityServiceProvider')

export function COGNITO_IDENTITY_FACTORY () {
  return new CognitoIdentityServiceProvider()
}

export const SNS_TOKEN = Symbol.for('SNS')
export function SNS_FACTORY () {
  return new SNS()
}

export const LAMBDA_TOKEN = Symbol.for('Lambda')
export function LAMBDA_FACTORY () {
  return new Lambda()
}

// const options = {
//   region: 'local',
//   endpoint: 'http://localhost:8000'
// }

// export const DYNAMO_DB = new InjectionToken<DynamoDB.DocumentClient>('DYNAMO_DB')

// export function dynamoDbFactory (_config: Config) {
//   const isOffline = false
//   return isOffline
//     ? new DynamoDB.DocumentClient(options) :
//     new DynamoDB.DocumentClient()
// }
