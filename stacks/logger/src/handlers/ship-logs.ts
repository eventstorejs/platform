import '@eventstorejs/request'
import { Callback } from 'aws-lambda'
import { gunzip } from 'zlib'
import { Context } from '@eventstorejs/request'

import { processAll } from '../lib'

module.exports.default = async (event: any, _context: Context, callback: Callback) => {
  const payload = new Buffer(event.awslogs.data, 'base64')
  gunzip(payload, (err, result) => {
    if (err) {
      // ignore
      return callback(null, {
        status: 'failed'
      })
    }
    const json = result.toString('utf-8')

    const logEvent = JSON.parse(json)

    /*tslint:disable */
    processAll(logEvent.logGroup, logEvent.logStream, logEvent.logEvents)
      .then(() => {
        callback(null, { status: `Successfully processed ${logEvent.logEvents.length} log events.` })
      })
      .catch((e) => {
        console.log(`Internal Error while processing logs`, e)
        // ignore
        return callback(null, {
          status: 'failed'
        })
      })
    /*tslint:enable */
  })

}
