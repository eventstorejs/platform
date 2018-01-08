import handler from './mail-cqrs'
import { tryParseJson } from '@eventstorejs/core'

test('test bootstrap', (done) => {
  (handler as any)({ Records: [] } as any, {} as any, (e: any, _resp: any) => {
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
