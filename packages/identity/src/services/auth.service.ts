import { injectable, inject } from 'inversify'
import { unauthorized } from 'boom'
import { Config } from '@eventstorejs/core'
import fetch from 'node-fetch'
import { decode, verify } from 'jsonwebtoken'
import { isArray } from 'lodash'
import { logger, Identity } from '@eventstorejs/request'
import { Role } from '../declarations'
const jwkToPem = require('jwk-to-pem')

const log = logger('auth')

@injectable()
export class AuthService {

  private _pems: Promise<any>

  constructor (@inject(Config) private config: Config) {
  }

  static hasRole (currentRoles: Array<string> | undefined, expectedGroups: Array<string> | string) {
    if (currentRoles) {
      const groupsToCheck = isArray(expectedGroups) ? expectedGroups : [expectedGroups]
      for (const g of currentRoles) {
        if (groupsToCheck.indexOf(g) >= 0) {
          return true
        }
      }
    }
    return false
  }

  static hasFeature (currentFeatures: Array<string> | undefined, expectedFeature: string): boolean {
    if (currentFeatures) {
      return currentFeatures.indexOf(expectedFeature) >= 0
    }
    return false
  }

  // static hasRole (group: string, groups: Array<string> | undefined): boolean {
  //   if (groups) {
  //     return groups.indexOf(group) >= 0
  //   }
  //   return false
  // }

  // hasAnyRole (group: Array<string>, groups: Array<string> | undefined) {
  //   return AuthService.hasAnyRole(group, groups)
  // }
  hasRole (currentRoles: Array<string> | undefined, expectedGroups: Array<string> | string) {
    return AuthService.hasRole(currentRoles, expectedGroups)
  }

  async resolveToken (token: string): Promise<Identity> {

    const pems = await this.init()

    // Fail if the token is not jwt
    const decodedJwt = decode(token, { complete: true }) as any
    if (!decodedJwt) {
      throw unauthorized(`Not a valid JWT token`)
    }

    // Fail if token is not from your User Pool
    if (decodedJwt.payload.iss !== pems.iss) {
      log.debug(`Invalided issues expected: ${pems.iss} got ${decodedJwt.payload.iss}`)
      throw unauthorized(`Invalid Issuer`)
    }

    // Get the kid from the token and retrieve corresponding PEM
    const kid = decodedJwt.header.kid
    const pem = pems.pems[kid]
    if (!pem) {
      throw unauthorized(`Not a valid JWT token`)
    }

    // Verify the signature of the JWT token to ensure it's really coming from your User Pool
    const identity = await new Promise<Identity>((resolve, reject) => {
      verify(token as string, pem, { issuer: pems.iss }, (err: Error, payload: any) => {
        if (err) {
          log.info(`Token rejected`)
          reject(unauthorized(`Token expired`))
        } else {
          const groups = payload['cognito:groups']
          resolve({
            accountId: payload.sub,
            groups,
            username: payload['cognito:username'],
            email: payload['email'],
            tenant: payload['custom:tenant'],
            isAdmin: this.hasRole(groups, Role.Admin),
            cognitoIdentityId: '',
            cognitoIdentityPoolId: ''
          })
        }
      })
    })
    return identity
  }

  private init (): Promise<{ pems: any, iss: string }> {
    if (!this._pems) {
      this._pems = new Promise(async (resolve, reject) => {
        try {
          const iss = `https://cognito-idp.${await this.config.resolve<string>('REGION')}.amazonaws.com/${await this.config.resolve<string>('auth/userpool/id')}`

          log.info(`First time. Downloading keys`)
          const pems: any = {}
          const res = await fetch(`${iss}/.well-known/jwks.json`)
          const keys = (await res.json()).keys
          for (let i = 0; i < keys.length; i++) {
            // Convert each key to PEM
            const keyId = keys[i].kid
            const modulus = keys[i].n
            const exponent = keys[i].e
            const keyType = keys[i].kty
            const jwk = { kty: keyType, n: modulus, e: exponent }
            const pem = jwkToPem(jwk)
            pems[keyId] = pem
          }
          resolve({ pems, iss })
        } catch (e) {
          log.error(`Error while setting up pems!!!`, e)
          reject(e)
        }
      })
    }
    return this._pems
  }
}
