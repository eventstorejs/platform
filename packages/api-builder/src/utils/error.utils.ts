import { ApiError } from '../definitions'

export class ErrorUtils {

  static build (error: ApiError, previous?: ApiError): ApiError {
    if (!previous) {
      return {
        ...error,
        thrownAt: new Date(),
        stackTrace: []
      }
    }
    return {
      ...error,
      thrownAt: new Date(),
      stackTrace: [
        previous,
        ...previous.stackTrace || []
      ]
    }
  }

  static parseAsMessage (e: Error): any {
    let message = undefined
    try {
      message = e.toString()
    } catch (e) {
      //
    }
    return message
  }

}
