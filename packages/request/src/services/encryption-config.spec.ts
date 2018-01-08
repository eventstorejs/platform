import 'reflect-metadata'
import 'jest'

import { Mock, It, Times } from 'typemoq'
import { EncryptionConfig } from './encryption-config'

declare const Buffer: any

test('resolve encrypted varialbe', async () => {
  let key = Math.random().toString(36)
  let value = 'SOME_VALUE'
  const ENCRYPTED_VALUE = (Buffer as any)(value, 'utf8').toString('base64')

  let kms = Mock.ofType<any>()
  kms.setup(x => x.decrypt(It.is<any>(p => {
    expect(p.CiphertextBlob).toBeInstanceOf(Buffer)
    return true
  })))
    .returns(() => ({
      promise: () => Promise.resolve({Plaintext: value})
    }))
    .verifiable(Times.once())

  let c = new EncryptionConfig({
    [key]: `{cipher} ${ENCRYPTED_VALUE}`
  }, kms.object)

  expect(await c.resolve<string>(key)).toBe(value)
  expect(await c.resolve<string>(key)).toBe(value)
  kms.verifyAll()
})
