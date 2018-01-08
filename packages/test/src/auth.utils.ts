
import { CognitoUserAttribute, AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

export class AuthUtils {

  public static END_TO_END_USER = 'e2e'

  public static END_TO_END_MAIL = 'e2e@eventstorejs.de'

  public static END_TO_END_PASSWORD = 'Some$up3erSe(rEtPassw0rD'

  static async createUser (email: string, username: string, password: string) {
    const poolData = {
      UserPoolId: process.env['COGNITO_USER_POOL_ID'], // Your user pool id here
      ClientId: process.env['COGNITO_CLIENT_ID'] // Your client id here
    }
    const userPool = new CognitoUserPool(poolData as any)

    const attributeList: Array<CognitoUserAttribute> = []

    const dataEmail = {
      Name: 'email',
      Value: email
    }

    const attributeEmail = new CognitoUserAttribute(dataEmail)

    attributeList.push(attributeEmail)
    return new Promise((resolve, reject) => {
      userPool.signUp(username, password, attributeList, null as any, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve((result as any).user)
      })
    })
  }

  static async createUserIfNotExists (email: string, username: string, password: string) {
    try {
      await AuthUtils.createUser(email, username, password)
    } catch (e) {
      if (e.name === 'UsernameExistsException') {
        // ignore
      } else {
        throw e
      }
    }
  }

  static async createEndToEndUser () {
    await AuthUtils.createUserIfNotExists(AuthUtils.END_TO_END_MAIL, AuthUtils.END_TO_END_USER, AuthUtils.END_TO_END_PASSWORD)
  }

  static async confirmUser () {
    throw new Error('dont know how ....')
  }

  static async login (username: string, password: string): Promise<string> {
    const authenticationData = {
      Username: username,
      Password: password
    }
    const authenticationDetails = new AuthenticationDetails(authenticationData)
    const poolData = {
      UserPoolId: process.env['COGNITO_USER_POOL_ID'], // Your user pool id here
      ClientId: process.env['COGNITO_CLIENT_ID'] // Your client id here
    }
    const userPool = new CognitoUserPool(poolData as any)
    const userData = {
      Username: username,
      Pool: userPool
    }
    const cognitoUser = new CognitoUser(userData)
    return new Promise<string>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result.getIdToken().getJwtToken())
        },

        onFailure: (err) => {
          reject(err)
        }

      })
    })
  }

  static async loginEndToEndUser (): Promise<string> {
    await AuthUtils.createEndToEndUser()
    const token = await AuthUtils.login(AuthUtils.END_TO_END_USER, AuthUtils.END_TO_END_PASSWORD)
    console.log(`End to end user created. Got token`)
    return token
  }

}
