import { CloudWatch } from 'aws-sdk'
import { chunk } from 'lodash'

const cloudWatch = new CloudWatch()

export async function publishMetrics (metricDatum: Array<any>, namespace: string) {
  let metricData = metricDatum.map(m => ({
    MetricName: m.name,
    Dimensions: m.dimensions,
    Timestamp: m.timestamp,
    Unit: m.unit,
    Value: m.value
  }))

  // cloudwatch only allows 20 metrics per request
  let chunks = chunk(metricData, 20)

  for (let chunk of chunks) {
    let req = {
      MetricData: chunk,
      Namespace: namespace
    }

    await cloudWatch.putMetricData(req).promise()
  }
}
