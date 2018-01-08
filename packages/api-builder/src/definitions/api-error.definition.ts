import * as t from 'io-ts'
import { DateType } from '../types'

export type ApiError = {
  key: string,
  thrownAt?: Date,
  message?: string,
  stackTrace?: Array<ApiError>
}

export const ApiError = t.recursion<ApiError>('ApiError', self => t.interface({
  key: t.string,
  thrownAt: t.union([t.undefined, DateType]),
  message: t.union([t.undefined, t.string]),
  stackTrace: t.union([t.undefined, t.array(self)])
}))
