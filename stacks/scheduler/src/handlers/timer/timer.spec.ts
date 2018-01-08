import handler from './timer'
import { tryParseJson } from '@eventstorejs/core'

test.skip('test bootstrap', (done) => {
  (handler as any)({ body: {} } as any, {} as any, (e: any, _resp: any) => {
    if (e) {
      const parsed = tryParseJson<any>(e)
      if (parsed && parsed.statusCode < 500) {
        return done()
      }
      done.fail(e)
    }
    done()
  })
})
