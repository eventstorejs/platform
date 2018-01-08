import { Mock, Times } from 'typemoq'

import { Config } from '@eventstorejs/core'
import { MailService } from '@eventstorejs/mail'
import { StorageService } from '@eventstorejs/storage'

class MailgunMock {
  messages () {
    //
  }
}

// test('test render and send mail', async () => {
//   expect.assertions(4)
//   let config = Mock.ofType(Config)
//   let template = Mock.ofType(TemplateService)
//   let mg = Mock.ofType(MailgunMock)
//   let mgFactory = new MailgunFactory(null as any)
//   mgFactory['_client'] = Promise.resolve(mg.object)
//   let context = { name: 'Jonas' }

//   template.setup(x => x.process(TEMPLATE, context))
//     .returns(() => Promise.resolve(`Some compiled template`))
//     .verifiable(Times.once())

//   mg.setup(x => x.messages())
//     .returns(() => ({
//       send: (data: any) => {
//         expect(data.from).toBe('Some Name <noreply@radwechseldich.de>')
//         expect(data.to).toBe('customer@eventstorejs.de')
//         expect(data.subject).toBe('Hello World')
//         expect(data.html).toBeDefined()
//       }
//     }))
//     .verifiable(Times.once())

//   let mail = new MailService(config.object, template.object, mgFactory)

//   await mail.send({
//     from: {
//       name: 'Some Name',
//       mail: 'noreply@radwechseldich.de'
//     },
//     to: 'customer@eventstorejs.de',
//     subject: 'Hello World',
//     template: TEMPLATE,
//     context
//   })
//   mg.verifyAll()
//   template.verifyAll()
// })

test('test send mail without template', async () => {
  expect.assertions(4)
  const config = Mock.ofType(Config)
  const storage = Mock.ofType(StorageService)
  const mg = Mock.ofType(MailgunMock)

  mg.setup(x => x.messages())
    .returns(() => ({
      send: (data: any) => {
        expect(data.from).toBe('Some Name <noreply@radwechseldich.de>')
        expect(data.to).toBe('customer@eventstorejs.de')
        expect(data.subject).toBe('Hello World')
        expect(data.html).toBeDefined()
      }
    }))
    .verifiable(Times.once())

  const mail = new MailService(config.object, storage.object, () => Promise.resolve<any>(mg.object))

  await mail.send({
    from: {
      name: 'Some Name',
      mail: 'noreply@radwechseldich.de'
    },
    to: 'customer@eventstorejs.de',
    subject: 'Hello World',
    html: '<html></html>'
  })
  mg.verifyAll()
  storage.verifyAll()
})
