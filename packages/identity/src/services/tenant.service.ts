import { injectable, inject } from 'inversify'
import { DynamoDB } from 'aws-sdk'
import { DYNAMO_TOKEN } from '@eventstorejs/aws'
import { notFound } from 'boom'
import { Tenant } from '../declarations'
import { Config, tryParseJson, tryStringifyJson } from '@eventstorejs/core'

@injectable()
export class TenantService {

  private _tenantTable: Promise<string> = this.config.resolve<any>('auth/tables/tenant')

  constructor ( @inject(Config) private config: Config, @inject(DYNAMO_TOKEN) private dynamo: DynamoDB.DocumentClient) {

  }

  async findOne (tenantId: string): Promise<Tenant> {
    let res = await this.dynamo.get({
      TableName: await this._tenantTable,
      Key: { tenantId }
    }).promise()
    if (!res.Item) {
      throw notFound(`Tenant ${tenantId} not found`, {
        code: 'NOT_FOUND'
      })
    }
    return {
      tenantId: res.Item.tenantId,
      features: tryParseJson(res.Item.features) || []
    } as Tenant

  }

  async save (tenant: Tenant) {
    await this.dynamo.put({
      TableName: await this._tenantTable,
      Item: {
        tenantId: tenant.tenantId,
        features: tryStringifyJson(tenant.features || [])
      }
    }).promise()
  }

}
