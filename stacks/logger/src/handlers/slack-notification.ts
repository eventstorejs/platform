import '@eventstorejs/request'
import { Callback } from 'aws-lambda'
import { Context } from '@eventstorejs/request'
import { } from 'aws-sdk'
import * as url from 'url'
import * as https from 'https'
import * as _ from 'lodash'

let hookUrl = 'https://hooks.slack.com/services/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'

const config = {
  slackChannel: '#error',
  slackUsername: 'Slack-CloudWatch-Bot',
  icon_emoji: ':robot_face:',
  orgName : '4WITS',
  orgIcon: 'https://assertible.com/images/logo/logo-64x64.png',
  services: {
    cloudwatch: {
      // text in the sns message or topicname to match on to process this service type
      match_text: 'CloudWatchNotifications'
    }
  }
}

let baseSlackMessage = {
  channel: config.slackChannel,
  username: config.slackUsername,
  icon_emoji: config.icon_emoji,
  attachments: [
    {
      'footer': config.orgName,
      'footer_icon': config.orgIcon
    }
  ]
}

let postMessage = function (message: any, callback: Function) {
  let body = JSON.stringify(message)
  let options = url.parse(hookUrl) as any
  options.method = 'POST'
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }

  let postReq = https.request(options, function (res) {
    let chunks: Array<any> = []
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      return chunks.push(chunk)
    })
    res.on('end', function () {
      let body = chunks.join('')
      if (callback) {
        callback({
          body: body,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        })
      }
    })
    return res
  })

  postReq.write(body)
  postReq.end()
}

let handleCloudWatch = function (event: any, _context: Context) {
  let timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime() / 1000
  let message = JSON.parse(event.Records[0].Sns.Message)
  let region = event.Records[0].EventSubscriptionArn.split(':')[3]
  let subject = 'AWS CloudWatch Notification'
  let alarmName = message.AlarmName
  let metricName = message.Trigger.MetricName
  let oldState = message.OldStateValue
  let newState = message.NewStateValue
  // let alarmDescription = message.AlarmDescription
  let alarmReason = message.NewStateReason
  let trigger = message.Trigger
  let color = 'warning'

  if (message.NewStateValue === 'ALARM') {
    color = 'danger'
  } else if (message.NewStateValue === 'OK') {
    color = 'good'
  }

  let slackMessage = {
    text: '*' + subject + '*',
    attachments: [
      {
        'color': color,
        'fields': [
          { 'title': 'Alarm Name', 'value': alarmName, 'short': true },
          { 'title': 'Alarm Description', 'value': alarmReason, 'short': false },
          {
            'title': 'Trigger',
            'value': trigger.Statistic + ' '
            + metricName + ' '
            + trigger.ComparisonOperator + ' '
            + trigger.Threshold + ' for '
            + trigger.EvaluationPeriods + ' period(s) of '
            + trigger.Period + ' seconds.',
            'short': false
          },
          { 'title': 'Old State', 'value': oldState, 'short': true },
          { 'title': 'Current State', 'value': newState, 'short': true },
          {
            'title': 'Link to Alarm',
            'value': 'https://console.aws.amazon.com/cloudwatch/home?region=' + region + '#alarm:alarmFilter=ANY;name=' + encodeURIComponent(alarmName),
            'short': false
          }
        ],
        'ts': timestamp
      }
    ]
  }
  return _.merge(slackMessage, baseSlackMessage)
}

let handleCatchAll = function (event: any, _context: Context) {

  let record = event.Records[0]
  let subject = record.Sns.Subject
  let timestamp = new Date(record.Sns.Timestamp).getTime() / 1000
  let message = JSON.parse(record.Sns.Message)
  let color = 'warning'

  if (message.NewStateValue === 'ALARM') {
    color = 'danger'
  } else if (message.NewStateValue === 'OK') {
    color = 'good'
  }

  // Add all of the values from the event message to the Slack message description
  let description = ''
  for (let key in message) {

    let renderedMessage = typeof message[key] === 'object'
      ? JSON.stringify(message[key])
      : message[key]

    description = description + '\n' + key + ': ' + renderedMessage
  }

  let slackMessage = {
    text: '*' + subject + '*',
    attachments: [
      {
        'color': color,
        'fields': [
          { 'title': 'Message', 'value': record.Sns.Subject, 'short': false },
          { 'title': 'Description', 'value': description, 'short': false }
        ],
        'ts': timestamp
      }
    ]
  }

  return _.merge(slackMessage, baseSlackMessage)
}

let processEvent = function (event: any, context: Context, callback: Function) {
  console.log('sns received:' + JSON.stringify(event, null, 2))
  let slackMessage = null
  let eventSubscriptionArn = event.Records[0].EventSubscriptionArn
  let eventSnsSubject = event.Records[0].Sns.Subject || 'no subject'
  let eventSnsMessage = event.Records[0].Sns.Message

  if (eventSubscriptionArn.indexOf(config.services.cloudwatch.match_text) > -1 || eventSnsSubject.indexOf(config.services.cloudwatch.match_text) > -1 || eventSnsMessage.indexOf(config.services.cloudwatch.match_text) > -1) {
    console.log('processing cloudwatch notification')
    slackMessage = handleCloudWatch(event, context)
  } else {
    slackMessage = handleCatchAll(event, context)
  }

  postMessage(slackMessage, function (response: any) {
    if (response.statusCode < 400) {
      console.info('message posted successfully')
      callback(null, {
        status: 'OK'
      })
    } else if (response.statusCode < 500) {
      console.error('error posting message to slack API: ' + response.statusCode + ' - ' + response.statusMessage)
      // Don't retry because the error is due to a problem with the request
      callback(null, {
        status: 'OK'
      })
    } else {
      // Let Lambda retry
      callback('server error when processing message: ' + response.statusCode + ' - ' + response.statusMessage)
    }
  })
}

module.exports.default = async (event: any, context: Context, callback: Callback) => {
  if (hookUrl) {
    processEvent(event, context, callback)
  } else {
    context.fail('hook url has not been set.')
  }
}
