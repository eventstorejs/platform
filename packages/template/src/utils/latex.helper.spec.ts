import 'reflect-metadata'
import 'jest'
import { latexEscape } from './latex.helper'

test('test escpae special charaters', async () => {
  expect(latexEscape('\\document content_after')).toBe('\\\\document content\\_after')
  expect(latexEscape('\#\\')).toBe('\\\#\\\\')
  expect(latexEscape('_')).toBe('\\_')
  expect(latexEscape(1)).toBe(1)
})

test(`test to throw on non string`, async () => {
  expect(() => latexEscape({} as any)).toThrow()
  expect(() => latexEscape([] as any)).toThrow()
})

test(`test keep undefined and null`, async () => {
  expect(latexEscape(undefined)).toBe(undefined)
  expect(latexEscape(null as any)).toBe(null)
})
