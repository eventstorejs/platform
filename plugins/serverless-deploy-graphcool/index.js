"use strict";
const exec = require('process-promises').exec;
const path = require('path');
const fs = require("fs");
const _ = require("lodash");
const Promise = require("bluebird");
const yml = require('yaml-ast-parser')

const graphcoolCli = path.join(require.resolve('graphcool'), '..', '..', '..', '.bin', 'graphcool');

/**
 * Serverless Plugin to
 */
class Graphcool {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.region = 'eu-central-1';

    this.aws = this.serverless.getProvider('aws');

    this.commands = {
      graphcool: {
        lifecycleEvents: [
          'graphcool',
        ],
        commands: {
          'deploy': {
            lifecycleEvents: [
              'init',
              'deploy'
            ],
          }
        }
      },
    };

    this.hooks = {
      'graphcool:deploy:init': () => this.init(),
      'graphcool:deploy:deploy': () => this.deployGraphcool(),
      'before:package:initialize': () => this.init(),
      "before:deploy:deploy": () => this.deployGraphcoolIfNotExists(),
      "after:deploy:finalize": () => this.deployGraphcool()
    };

  }

  getTargets() {
    let ymlNode = yml.load(fs.readFileSync(path.join(this.graphcool.path, '.graphcoolrc'), {
      encoding: 'utf-8'
    }))
    let targets = {}
    if (ymlNode) {
      for (let mapping of ymlNode.mappings) {
        if (mapping.key.value === 'targets') {
          for (let t of mapping.value.mappings) {
            targets[t.key.value] = t.value.value
          }
          break
        }
      }
    }
    return targets
  }

  getTarget() {
    return this.aws.request('SSM', 'getParameter', {
        Name: this.graphcool.ssm
      }, this.stage, this.region)
      .then((p) => p.Parameter.Value)
      .catch((e) => {
        this.serverless.cli.log(`Existing graphcool service not found`)
      })
  }

  init() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
    this.graphcool = _.merge({}, {
      ssm: `/${this.stage}/graphcool/${this.serverless.service.service}`,
      env: 'GRAPHCOOL_ENDPOINT',
      path: './graphcool',
      name: `${this.stage}-${this.serverless.service.service}`,
      cluster: 'shared-eu-west-1'
    }, this.serverless.service.custom.graphcool)
    return this.getTarget()
      .then((t) => this.target = t)
      .then(() => this.serverless.service.provider.environment[this.graphcool.env] = `https://api.graph.cool/simple/v1/${this.target.split('/')[1]}`)

  }

  deployGraphcoolIfNotExists() {
    if (!this.target) {
      this.serverless.cli.log(`Graphcool does not exists yet. Therefore deploying early!`)
      return this.deployGraphcool();
    } else {
      this.serverless.cli.log(`Graphcool exists as ${this.target}`)
      return Promise.resolve();
    }
  }

  deployGraphcool() {
    // return exec('graphcool login')
    // .then(() => exec(`npm install`, {
    //   cwd: this.graphcool.path
    // }))
    if(this.target) {
      fs.writeFileSync(path.join(this.graphcool.path, '.graphcoolrc'), `\
targets:
  ${this.stage}: ${this.target}
  default: ${this.stage}`, 'utf-8')
    }
    return exec(`${graphcoolCli} deploy --target ${this.stage} --new-service ${this.graphcool.name} --new-service-cluster ${this.graphcool.cluster}`, {
        cwd: this.graphcool.path
      })
      .then(() => {
        this.serverless.cli.log(`Deployed to graphcool as ${this.graphcool.name}`)
        if (this.graphcool.ssm) {
          this.serverless.cli.log(`Uploading endpoint to ssm as ${this.graphcool.ssm}`)
          return this.aws.request('SSM', 'putParameter', {
            Overwrite: true,
            Name: this.graphcool.ssm,
            Value: this.getTargets()[this.stage],
            Type: 'String'
          }, this.stage, this.region)
        } else {
          return Promise.resolve();
        }
      })
  }
}

module.exports = Graphcool;
