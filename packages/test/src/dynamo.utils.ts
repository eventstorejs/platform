import { DynamoDB } from 'aws-sdk'
require('dotenv').config()

export class DynamoUtils {

  private static _connection: DynamoDB.DocumentClient

  static getConnection (): DynamoDB.DocumentClient {
    if (!DynamoUtils._connection) {
      DynamoUtils._connection = new DynamoDB.DocumentClient({
        region: process.env.REGION
      })
    }
    return DynamoUtils._connection
  }

  // async clearEventStore ():Promise<any> {
  // }

}
