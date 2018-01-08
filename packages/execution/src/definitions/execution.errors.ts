export class ExecutionFailedError extends Error {
  constructor (public original: string, m: string, public statusCode: number) {
    super(m)
    Object.setPrototypeOf(this, ExecutionFailedError.prototype)
  }
}
