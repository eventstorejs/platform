import { CognitoIdentity } from 'aws-lambda'

export interface Identity extends CognitoIdentity {
  accountId: string
  tenant?: string
  groups?: Array<string>
  username: string
  email: string
  isAdmin: boolean
}
