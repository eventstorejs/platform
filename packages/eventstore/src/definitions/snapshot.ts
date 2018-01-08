export interface Snapshot {
  aggregateId: string
  aggregateType: string
  context: string
  attributes: any
  revision: number
  committedAt: Date
}
