import { Context as AWSContext } from 'aws-lambda'
import { Identity } from './identity.definition'
import { InvocationType } from './invocation-type.definition'
import { Tenant } from './tenant.definition'
// import { TenantModel } from '@api'

export interface Context extends AWSContext {
  identity?: Identity
  tenant?: Tenant
  invocationType?: InvocationType
  correlationId?: string
  // tenant?: TenantModel
  requestStarted?: Date
  method?: string
  params?: {}
  query?: {}
  headers?: { [key: string ]: string }
}
