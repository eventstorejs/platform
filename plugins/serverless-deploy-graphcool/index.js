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
      "after:deploy:finalize": () => this.deployGraphcool()
    };

  }

  init() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
    this.graphcool = _.merge({
      path: './graphcool',
      name: `${this.stage}-${this.serverless.service.service}`,
      cluster: 'shared-eu-west-1'
    }, this.serverless.service.custom.graphcool)
    let ymlNode = yml.load(fs.readFileSync(path.join(this.graphcool.path, '.graphcoolrc'), {
      encoding: 'utf-8'
    }))
    let targets = {}
    for (let mapping of ymlNode.mappings) {
      if (mapping.key.value === 'targets') {
        for (let t of mapping.value.mappings) {
          targets[t.key.value] = t.value.value
        }
        break
      }
    }
    if (!targets[this.stage]) {
      throw new Error(`Graphcool Projekt not yet deployed in ${this.stage} and cannot set env variable. use sls graphcool deploy to deploy first`)
    }
    this.serverless.service.provider.environment['GRAPHCOOL_ENDPOINT'] = targets[this.stage]
  }

  deployGraphcool() {
    // return this.aws.request('SSM', 'getParameter', {
    //   Name: `/${this.stage}/eventstore/key`
    // }, this.stage, this.region)
    return Promise.resolve({
        Parameter: {
          Value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1MTEzNDE4NzgsImNsaWVudElkIjoiY2phYXR4anFoMDZuaDAxNTVpM29maXJueiJ9.weD-CKLSy2izpCnETB0JzsthGPJQt1hP99ff4ICqnt0'
        }
      })
      .then(p => p.Parameter.Value)
      .then((r) => exec(`graphcool login --token ${r}`))
      // .then(() => exec(`npm install`, {
      //   cwd: this.graphcool.path
      // }))
      .then(() => exec(`${graphcoolCli} deploy --target ${this.stage} --new-service ${this.graphcool.name} --new-service-cluster ${this.graphcool.cluster}`, {
        cwd: this.graphcool.path
      }))
      .then(() => this.serverless.cli.log(`Deployed to graphcool as ${this.graphcool.name}`))
  }
}

module.exports = Graphcool;
