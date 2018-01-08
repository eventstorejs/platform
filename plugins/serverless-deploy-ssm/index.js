'use strict';

// https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const BbPromise = require('bluebird');
const _ = require('lodash');

const resolveCloudFormationenvVars = require('serverless-export-env/src/lib/resolveCloudFormationEnvVariables')

class DeploySSM {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.stage = undefined
    this.region = 'eu-central-1';

    this.config = undefined;

    this.aws = this.serverless.getProvider('aws');

    this.commands = {
      ssm: {
        lifecycleEvents: [
          'ssm',
        ],
        commands: {
          'deploy': {
            lifecycleEvents: [
              'init',
              'parameters'
            ],
          },
          'add': {
            lifecycleEvents: [
              'init',
              'add'
            ],
          },
          'encrypt': {
            lifecycleEvents: [
              'init',
              'encrypt'
            ],
            options: {
              value: {
                usage: 'Value of variable',
                shortcut: 'v',
                required: true,
              }
            }
          }
        }
      },
    };
    this.hooks = {
      'ssm:ssm': () => {
        this.serverless.cli.generateCommandsHelp(['ssm']);
        return BbPromise.resolve();
      },
      'ssm:deploy:init': () => this.init(),
      'ssm:deploy:parameters': () => this.deployParameters(),
      'ssm:add:init': () => this.init(),
      'ssm:add:add': () => this.addParameter(),
      'ssm:encrypt:init': () => this.init(),
      'ssm:encrypt:encrypt': () => this.printEncryptedParamater(),
      'before:deploy:finalize': () => this.init(),
      'after:deploy:finalize': () => this.deployParameters()
    };
  }

  init() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
  }

  deployParameters() {
    return new Promise((resolve, reject) => {

      let variables = this.serverless.service.custom.ssm || {}

      resolveCloudFormationenvVars(this.serverless, _.mapValues(variables, (v) => v.value ? v.value : v))
        .then((result) => {
          let requests = []
          for (let name in result) {
            let params = {
              Overwrite: true,
              Name: `/${this.stage}/${name}`,
              Description: variables[name].description ? variables[name].description : undefined,
              Value: result[name],
              Type: 'String'
            }
            let request = Promise.resolve()
            if (variables[name].encrypted) {
              params.Type = 'SecureString'
                request =
                this.aws.request('SSM', 'getParameter', {
                  Name: `/${this.stage}/eventstore/key`
                }, this.stage, this.region)
                .then(p => {
                  params.KeyId = p.Parameter.Value
                })
                .then(() =>
                  this.aws.request('KMS', 'decrypt', {
                    CiphertextBlob: Buffer.from(result[name], 'base64')
                  }, this.stage, this.region))
                .then((v) => {
                  params.Value = v.Plaintext.toString('utf-8')
                })
            }
            requests.push(request.then(() => this.aws.request('SSM', 'putParameter', params, this.stage, this.region)))
          }

          return Promise.all(requests)
        })
        .then((result) => {
          resolve()
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  addParameter() {
    return this.encryptParameter(this.options.name)
      .then(() => {

      })
  }


  printEncryptedParamater() {
    return this.encryptParameter(this.options.value)
      .then((p) => {
        console.log(p)
      })
  }

  encryptParameter(value) {
    return this.aws.request('SSM', 'getParameter', {
        Name: `/${this.stage}/eventstore/key`
      }, this.stage, this.region)
      .then((p) => this.aws.request('KMS', 'encrypt', {
        Plaintext: Buffer.from(String(value)),
        KeyId: p.Parameter.Value
      }, this.stage, this.region))
      .then(p => p.CiphertextBlob.toString('base64'))
  }
}

module.exports = DeploySSM;
