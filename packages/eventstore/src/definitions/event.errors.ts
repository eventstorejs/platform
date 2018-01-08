export class RevisionConflictError extends Error {
  constructor (m: string) {
    super(m)
    Object.setPrototypeOf(this, RevisionConflictError.prototype)
  }
}

export class AggregateNotFoundError extends Error {
  constructor (m: string) {
    super(m)
    Object.setPrototypeOf(this, AggregateNotFoundError.prototype)
  }

}

export class SnapshotNotFoundError extends Error {
  constructor (m: string) {
    super(m)
    Object.setPrototypeOf(this, SnapshotNotFoundError.prototype)
  }

}
