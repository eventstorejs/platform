'use strict';

// https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const BbPromise = require('bluebird');
const _ = require('lodash');

const ServerlessAnnotations = require('serverless-annotations');

class EventStore {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.stage = undefined
    this.region = 'eu-central-1';

    this.config = undefined;

    this.aws = this.serverless.getProvider('aws');

    this.annotations = new ServerlessAnnotations(this.serverless, this.options)
    this.commands = {
      es: {
        usage: 'Eventstore management for Serverless',
        lifecycleEvents: [
          'es',
        ],
        commands: {
          'deploy': {
            lifecycleEvents: [
              'init',
              'commands'
            ],
          }
        }
      },
    };
    this.hooks = {
      'es:es': () => {
        this.serverless.cli.generateCommandsHelp(['es']);
        return BbPromise.resolve();
      },
      'es:deploy:init': () => this.extendServiceConfig(),
      'before:package:initialize': () => this.extendServiceConfig(),
      'before:invoke:local:invoke': () => this.extendServiceConfig(),
      'before:invoke:invoke': () => this.extendServiceConfig(),
      'before:deploy:function:initialize': () => this.extendServiceConfig(),
      'before:aws:logs:logs': () => this.extendServiceConfig(),

      'es:deploy:commands': () => this.deployCommands(),
      'after:deploy:finalize': () => this.deployCommands()
    };
  }

  extendServiceConfig() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
    const configPath = `/${this.stage}`
    return this.resolveSSMParameters(configPath)
      .then((ssmParams) => {
        this.config = {
          parameters: {
            eventstore: {
              bucket: `${this.stage}.eventstore`
            }
          }
        }
        if (ssmParams) {
          for (let p of ssmParams) {
            if (p && p.Name) {
              let parameterName = p.Name.replace(`${configPath}/`, '').split('/').join('.')
              _.set(this.config.parameters, parameterName, p.Value)
            }
          }
        }
        if (!this.serverless.service.custom) {
          this.serverless.service.custom = {}
        }
        return this.resolveEventStreamArn(this.config.parameters.eventstore.tables ? this.config.parameters.eventstore.tables.eventstore : undefined)
      })
      .then((eventStreamArn) => {
        this.serverless.service.custom.annotations = _.extend({}, {
          handlers: {
            handler: {},
            commandHandler: {
              events: [{
                sns: {
                  arn: this.config.parameters.eventstore['command-bus'] ? this.config.parameters.eventstore['command-bus'].arn.trim() : undefined
                }
              }]
            },
            eventHandler: {
              events: [{
                stream: {
                  type: 'dynamodb',
                  batchSize: 1,
                  arn: eventStreamArn
                }
              }]
            },
            cqrsHandler: {
              events: [{
                stream: {
                  type: 'dynamodb',
                  batchSize: 1,
                  arn: eventStreamArn
                }
              }]
            },
            sagaHandler: {
              events: [{
                stream: {
                  type: 'dynamodb',
                  batchSize: 1,
                  arn: eventStreamArn
                }
              }]
            }
          }
        }, this.serverless.service.custom ? this.serverless.service.custom.annotations : undefined);
        let existingIamRoleStatements = []
        if (_.isArray(this.serverless.service.provider.iamRoleStatements)) {
          existingIamRoleStatements = this.serverless.service.provider.iamRoleStatements
        }
        this.serverless.service.provider.iamRoleStatements = [
          ...existingIamRoleStatements,
          {
            Effect: 'Allow',
            Action: [
              'KMS:Decrypt'
            ],
            Resource: `arn:aws:kms:eu-central-1:*:key/${this.config.parameters.eventstore.key}`
          },
          {
            Effect: 'Allow',
            Action: [
              'SSM:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParametersByPath'
            ],
            Resource: [
              `arn:aws:ssm:eu-central-1:631908550553:parameter/${this.stage}/*`
            ]
          }, {
            Effect: 'Allow',
            Action: [
              'SNS:Publish'
            ],
            Resource: [
              this.config.parameters.eventstore['command-bus'] ? `${this.config.parameters.eventstore['command-bus'].arn}` : undefined
            ]
          }, {
            Effect: 'Allow',
            Action: [
              's3:*'
            ],
            Resource: [
              `arn:aws:s3:::${this.config.parameters.eventstore.bucket}`,
              `arn:aws:s3:::${this.config.parameters.eventstore.bucket}/*`
            ]
          }, {
            Effect: 'Allow',
            Action: [
              'dynamodb:*'
            ],
            Resource: this.config.parameters.eventstore.tables ? [
                `arn:aws:dynamodb:${this.region}:*:table/${this.config.parameters.eventstore.tables.eventstore}`,
                `arn:aws:dynamodb:${this.region}:*:table/${this.config.parameters.eventstore.tables.snapshot}`,
                `arn:aws:dynamodb:${this.region}:*:table/${this.config.parameters.eventstore.tables.saga}`,
                `arn:aws:dynamodb:${this.region}:*:table/${this.config.parameters.eventstore.tables['saga-association']}`
              ] :
              []
          }, {
            Effect: 'Allow',
            Action: [
              'lambda:InvokeFunction'
            ],
            Resource: [
              `arn:aws:lambda:${this.region}:*:function:${this.stage}-*`
            ]
          }
        ]
      });
  }

  deployCommands() {
    // arn:aws:lambda:eu-central-1:631908550553:function:rwd-api-prod-wheel-set-sync-saga
    return new Promise((resolve, reject) => {
      let handlers =
        this.annotations.collectHandlers()
        .filter(c => c.name === 'commandHandler' && c.handlers && c.handlers.length > 0)

      const accountId = '631908550553'; //TODO
      const service = this.serverless.service.service;
      const bucketName = ''
      const deployedAt = new Date().toISOString();
      let result = [];
      for (let h of handlers) {
        let lambdaArn = `arn:aws:lambda:${this.region}:${accountId}:function:${this.annotations.getFunctionName(this.stage, service, h.options.name)}`
        for (let c of h.handlers) {
          let context = c.options.context || h.options.context
          if (!context) {
            throw new Error(`Could not resolve context for ${h.fileName}. Either declare it on the request handler or event handler`)
          }
          let name = c.options.name
          if (!name) {
            name = c.options.type.split('.')[0].toLowerCase() + '.' + c.options.type.split('.').slice(-1).pop().toUpperCase().replace('COMMAND', '')
          }
          if (!name) {
            throw new Error(`CommandEventHandler at ${h.fileName} does not have a name. Either set type or name`)
          }
          result.push({
            name: name,
            context,
            lambdaArn,
            deployedAt
          });
        }
      }

      let params = {
        Bucket: this.config.parameters.eventstore.bucket,
        Key: `commands/${service}.json`,
        Body: JSON.stringify(result),
        ContentType: 'application/json'
      };
      this.aws.request('S3', 'putObject', params, this.stage, this.region)
        .then(() => resolve())
        .catch(e => reject(e))
    })
  }

  resolveSSMParameters(configPath, params = [], NextToken = undefined) {
    let requestParams = {
      Path: configPath,
      Recursive: true,
      WithDecryption: true,
      NextToken
    }
    const result = []
    return this.aws.request('SSM', 'getParametersByPath', requestParams, this.stage, this.region)
      .then((res) => {
        let nextParams = [
          ...params,
          ...res.Parameters
        ]
        if (res.NextToken) {
          return this.resolveSSMParameters(configPath, nextParams, res.NextToken)
        } else {
          return Promise.resolve(nextParams)
        }
      })
  }

  resolveEventStreamArn(table) {
    if (!table) {
      return undefined
    }
    return this.aws.request('DynamoDBStreams', 'listStreams', {
        TableName: table
      })
      .then(r => r.Streams[0].StreamArn.trim())
  }
}

module.exports = EventStore;
