import { Context } from '../definitions'

export interface Middleware {

  preRequest? (event: any, context: Context): Promise<void | any>

  postRequest? (res: any, event: any, context: Context): Promise<void | any>

  failedRequest?(err: Error, event: any, context: Context): Promise<void>

}
