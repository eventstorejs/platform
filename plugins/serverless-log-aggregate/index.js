'use strict';

// https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const BbPromise = require('bluebird');
const _ = require('lodash');

const ServerlessAnnotations = require('serverless-annotations');

class LogAggregate {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.stage = undefined
    this.region = 'eu-central-1';

    this.config = undefined;

    this.aws = this.serverless.getProvider('aws');

    this.annotations = new ServerlessAnnotations(this.serverless, this.options)
    this.commands = {};
    this.hooks = {
      'before:deploy:finalize': () => this.init(),
      'after:deploy:finalize': () => this.subscribeToAggregate().then(() => this.setRetention())
    };
  }

  init() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
    this.resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
  }

  subscribeToAggregate() {
    return this.aws.request('SSM', 'getParameter', {
        Name: `/${this.stage}/log/ship-logs/arn`
      }, this.stage, this.region)
      .then((p) => {
        const destArn = p.Parameter.Value
        let requests = []
        for (let key in this.resources) {
          let resource = this.resources[key]
          if (resource.Type === 'AWS::Logs::LogGroup') {

            let logGroupName = resource.Properties.LogGroupName

            requests.push(this.aws.request('CloudWatchLogs', 'putSubscriptionFilter', {
              destinationArn: destArn,
              logGroupName: logGroupName,
              filterName: `${this.stage}-ship-logs`,
              filterPattern: ''
            }, this.stage, this.region))
            this.serverless.cli.log(`Subscribed [${logGroupName}] to [${destArn}]`)
          }
        }
        return Promise.all(requests)
      })
  }

  setRetention() {
    const retentionDays = 30
    let requests = []
    for (let key in this.resources) {
      let resource = this.resources[key]
      if (resource.Type === 'AWS::Logs::LogGroup') {

        let logGroupName = resource.Properties.LogGroupName

        requests.push(this.aws.request('CloudWatchLogs', 'putRetentionPolicy', {
          logGroupName: logGroupName,
          retentionInDays: retentionDays
        }, this.stage, this.region))
        this.serverless.cli.log(`Set retention for [${logGroupName}] to [${retentionDays}]`)
      }
    }
    return Promise.all(requests)
  }
}

module.exports = LogAggregate;
