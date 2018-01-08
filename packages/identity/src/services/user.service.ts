import { injectable, inject } from 'inversify'
import { Config } from '@eventstorejs/core'
import { COGNITO_IDENTITY_TOKEN } from '@eventstorejs/aws'
import { CognitoUserAttribute, CognitoUserPool, ISignUpResult } from 'amazon-cognito-identity-js'
import { CognitoIdentityServiceProvider } from 'aws-sdk'
import { Role } from '../declarations'

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  tenant?: string
  noConfirm?: boolean
  roles: Array<Role>
}

@injectable()
export class UserService {

  constructor (
    @inject(Config) private config: Config,
    @inject(COGNITO_IDENTITY_TOKEN) private client: CognitoIdentityServiceProvider) {

  }

  async createUser (user: CreateUserRequest): Promise<any> {

    const userPoolId = await this.config.resolve<string>('auth/userpool/id')
    const clientId = await this.config.resolve<string>('auth/userpool/client_id')
    const poolData = {
      UserPoolId: userPoolId as string,
      ClientId: clientId as string
    }

    const userPool = new CognitoUserPool(poolData)

    const attributeList: CognitoUserAttribute[] = []

    attributeList.push(new CognitoUserAttribute({
      Name: 'email',
      Value: user.email

    }))

    if (user.tenant) {
      attributeList.push(new CognitoUserAttribute({
        Name: 'custom:tenant',
        Value: user.tenant
      }))
    }

    let signUp = await (new Promise<ISignUpResult>((resolve, reject) => {
      userPool.signUp(user.username, user.password, attributeList, null as any, (err, result) => {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      })
    }))
    for (let role of user.roles) {
      (await new Promise((resolve, reject) => {
        this.client.adminAddUserToGroup({ GroupName: role, UserPoolId: userPoolId as string, Username: signUp.user.getUsername() },
          (err, result) => {
            if (err) {
              return reject(err)
            }
            return resolve(result)

          })
      }))
    }
    if (!user.noConfirm) {
      (await new Promise((resolve, reject) => {
        this.client.adminConfirmSignUp({ UserPoolId: userPoolId as string, Username: signUp.user.getUsername() }, (err, result) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        })
      }))
    }
  }
}
