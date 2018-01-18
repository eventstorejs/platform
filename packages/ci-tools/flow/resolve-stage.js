#!/usr/bin/env node

const resolveStage = () => {
  if(!process.env['CIRCLE_BRANCH']) {
    console.log(`Could not resolve CIRCLE_BRANCH. Not running on ci?`)
    throw new Error(`Could not determine branch`)
  }
  let feature =  process.env['CIRCLE_BRANCH'].split('/')[1]
  feature = feature.split('.').join('-')
  return feature
}

console.log(resolveStage())

module.exports.resolveStage = resolveStage;
