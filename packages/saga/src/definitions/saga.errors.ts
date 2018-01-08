export class SagaNotFoundError extends Error {
  constructor (m: string) {
    super(m)
    Object.setPrototypeOf(this, SagaNotFoundError.prototype)
  }

}
