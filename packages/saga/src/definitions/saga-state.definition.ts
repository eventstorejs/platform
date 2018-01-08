
export interface SagaState {
  sagaId: string
  sagaType: string
  createdAt: Date
  updatedAt: Date
  finishedAt?: Date
  attributes: any
  _associationKeys?: Array<string>
}
