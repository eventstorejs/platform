
import { ContainerModule, interfaces } from 'inversify'

import {
  SSM_TOKEN,
  SSM_FACTORY,
  S3_TOKEN,
  S3_FACTORY,
  DYNAMO_TOKEN,
  DYNAMO_FACTORY,
  COGNITO_IDENTITY_TOKEN,
  COGNITO_IDENTITY_FACTORY,
  SNS_TOKEN,
  SNS_FACTORY,
  LAMBDA_TOKEN,
  LAMBDA_FACTORY
} from './tokens'

export const AwsModule = new ContainerModule((
  bind: interfaces.Bind,
  _unbind: interfaces.Unbind,
  _isBound: interfaces.IsBound,
  _rebind: interfaces.Rebind
) => {
  bind<any>(SSM_TOKEN).toConstantValue(SSM_FACTORY())
  bind<any>(S3_TOKEN).toConstantValue(S3_FACTORY())
  bind<any>(DYNAMO_TOKEN).toConstantValue(DYNAMO_FACTORY())
  bind<any>(COGNITO_IDENTITY_TOKEN).toConstantValue(COGNITO_IDENTITY_FACTORY())
  bind<any>(SNS_TOKEN).toConstantValue(SNS_FACTORY())
  bind<any>(LAMBDA_TOKEN).toConstantValue(LAMBDA_FACTORY())
})
