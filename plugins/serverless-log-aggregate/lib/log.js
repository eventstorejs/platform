const spawn = require('child_process').spawn
const StreamSplitter = require("stream-splitter");
const chalk = require('chalk');
const moment = require('moment');
const path = require('path');

const slsCwd = path.join(require.resolve('serverless'), '..', '..', '..', '.bin', 'sls');
const logStackPath = path.dirname(require.resolve('@eventstorejs/logger-stack'));

function setParameter(name, defaultValue) {
  let val = defaultValue
  let param = process.argv.find(v => v.trim().indexOf(name) === 0)
  if (param) {
    val = param.split("=")[1]
    console.log(`Filter: ${name} with ${val}`)
  }
  return `${name}${val ? '=':''}${val ? val : ''}`
}

let stage
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--stage') {
    stage = process.argv[i + 1]
    break
  }
}

let filter = [
  setParameter('timestamp', '2*'),
  setParameter('requestId'),
  setParameter('level'),
  setParameter('correlationId'),
  setParameter('handler'),
  setParameter('message')
]

let params = ['logs', '-f', 'ship-logs']

if(stage) {
  params = [
    ...params,
    '--stage',
    stage
  ]
}

params = [
  ...params, [`--filter`, `[${filter.join(',')}]`]
]
let noTail = process.argv.find(v => v.trim().indexOf('--noTail') === 0)
if (!noTail) {
  params.push('--tail')
}

let startTime = process.argv.find(v => v.trim().indexOf('--startTime') === 0)
if (startTime) {
  params.push(startTime)
} else {
  params.push('--startTime=60m')
}

const log = spawn(slsCwd, params, {
  cwd: logStackPath
});


let lastWasError = false

log.stdout.pipe(StreamSplitter("\n")).on('token', function (data) {
  let line = data.toString()
  let parts = line.split('\t')
  if(line.indexOf('START RequestId:') === 0 || line.indexOf('END RequestId:') === 0 || line.indexOf('REPORT RequestId:') === 0 ) {
    // ignore the start etc lines of the ship logs function
    return
  }
  if(line.trim() === '') {
    // dont print empty lines
    return
  }
  if (parts.length >= 3) {
    parts.splice(1, 1)
    parts[0] = chalk.cyan(parts[0])
    let messageParts = parts[1].trim().split(' ')
    let level = chalk.magenta(messageParts[0])
    lastWasError = false
    switch (messageParts[0]) {
      case '[INFO]':
        level = chalk.green(messageParts[0])
        break
      case '[WARN]':
        level = chalk.yellow(messageParts[0])
        break
      case '[ERROR]':
        level = chalk.red(messageParts[0])
        lastWasError = true
        break
    }
    messageParts[0] = level
    messageParts[2] = chalk.magenta(messageParts[2])
    let message = messageParts.join(' ')
    parts[1] = message
  } else {
    let payload = line
    if (payload) {
      let parsedPayload = payload
      try {
        payload = JSON.parse(payload)
        if (payload.name && payload.stack) {
          parsedPayload = `${chalk.red(`Error:`)} ${payload.name}\n`
          parsedPayload += `Message: ${payload.message}`
          parsedPayload += payload.output ? `\nStatus: ${payload.output.statusCode || 'NONE'} (${payload.output.payload ? payload.output.payload.error : ''})\n` : ''
          // only show stacktrace on real error
          if (lastWasError) {
            parsedPayload += `StackTrace: ${payload.stack}`
          }
        }
      } catch (e) {
        // ignore
      }
      parts = [parsedPayload]
    }

  }
  let log = parts.join('   ')
  console.log(log)
});

log.stderr.on('data', function (data) {
  console.log(data.toString());
  // process.exit(1)
});

log.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
  process.exit(code.toString())
});
