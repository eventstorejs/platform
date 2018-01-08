'use strict';

// https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const yml = require('yaml-ast-parser');
const semver = require('semver-diff');
const spawn = require('child_process').spawn

const slsCli = path.join(require.resolve('serverless'), '..', '..', '..', '.bin', 'serverless')


const RESOURCE_TO_TAG = 'ServerlessDeploymentBucket'
const VERSION_TAG_KEY = 'version'

function listStackResources(AWS, name, resources, nextToken) {
  resources = resources || [];
  return AWS.request("CloudFormation", "listStackResources", {
      StackName: name,
      NextToken: nextToken
    })
    .then(response => {
      resources.push.apply(resources, response.StackResourceSummaries);
      if (response.NextToken) {
        // Query next page
        return listStackResources(AWS, name, resources, response.NextToken);
      }
    })
    .return(resources);
}

class StackManager {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.stage = undefined
    this.region = 'eu-central-1';

    this.config = undefined;

    this.aws = this.serverless.getProvider('aws');

    this.package = require(path.resolve(process.cwd(), 'package.json'))

    this.commands = {
      stack: {
        lifecycleEvents: [
          'stack',
        ],
        commands: {
          'resolve': {
            lifecycleEvents: [
              'resolve'
            ],
          },
          'deploy': {
            lifecycleEvents: [
              'deploy'
            ],
            options: {
              name: {
                usage: 'Deploy specific stack',
                shortcut: 'n',
                required: false,
              },
              force: {
                usage: 'Force deploy',
                shortcut: 'f',
                required: false,
              }
            },
          }
        }
      },
    };
    this.hooks = {
      'stack:resolve:resolve': () => this.init().then(() => this.printVersions()),
      'stack:deploy:deploy': () => this.init().then(() => this.deployStacks()),
      'before:deploy:deploy': () => this.init().then(() => this.deployStacks()),
      'after:package:createDeploymentArtifacts': () => this.init().then(() => this.tagDeployBucketWithVersion())
    };
  }

  init() {
    this.stage = this.serverless.service.provider.stage;
    if (this.serverless.variables.options.stage) {
      this.stage = this.serverless.variables.options.stage;
    }
    this.stacks = this.serverless.service.custom.stacks || [];
    return Promise.resolve()
  }

  tagDeployBucketWithVersion() {
    this.resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
    this.resources[RESOURCE_TO_TAG] = _.merge(this.resources[RESOURCE_TO_TAG], {
      Properties: {
        Tags: [{
          Key: VERSION_TAG_KEY,
          Value: this.package.version
        }]
      }
    })
    return Promise.resolve()
  }

  printVersions() {
    return this.resolveVersions()
      .then((res) => {
        for (let stack of res) {
          this.serverless.cli.log(`Resolved ${stack.key} to ${stack.name} with local ${stack.localVersion} and deployed version ${stack.version || 'UNKOWN. (Maybe not deployed ?)'}`)
        }
      })

  }

  deployStacks() {
    return this.resolveVersions()
      .then(res => {
        let updates = []
        let toDeploy = res
        if (this.options.name) {
          toDeploy = res.filter(r => r.key === this.options.name)
        }
        if(this.options.force) {
          this.serverless.cli.log(`Force deploy enabled.`)
        }
        for (let stack of toDeploy) {
          if (!this.options.force) {
            if (stack.deployedVersion === stack.localVersion) {
              this.serverless.cli.log(`${stack.key} already deployed as ${stack.deployedVersion}`)
              continue;
            } else if (stack.deployedVersion && semver(stack.deployedVersion, stack.localVersion) === null) {
              this.serverless.cli.log(`${stack.key} has new version (${stack.deployedVersion}) deployed as local (${stack.localVersion})`)
              continue;
            } else if (stack.deployedVersion && semver(stack.deployedVersion, stack.localVersion) === 'major') {
              this.serverless.cli.log(`${stack.key} has new version (${stack.localVersion}) and deployed (${stack.deployedVersion}). Is mayor therefore not deploying. Use --force to trigger deploy`)
              continue;
            }
          }
          this.serverless.cli.log(`${stack.key} will be deploy with version ${stack.localVersion}`)
          updates.push(stack.key)
        }
        return Promise.each(updates, (key) => this.deployStack(key))
      });
  }

  deployStack(packageName) {
    return new Promise((resolve, reject) => {
      let stackPath = path.join(require.resolve(packageName), '..');
      let childEnv = _.clone(process.env)
      delete childEnv.SLS_DEBUG
      let output = ''
      const deploy = spawn(slsCli, ['deploy', '--stage', this.stage], {
        cwd: stackPath,
        env: childEnv
      });
      deploy.stdout.on('data', (data) => {
        output += data
        process.env.SLS_DEBUG && console.log(`${packageName}: ${data}`);
      })
      deploy.stderr.on('data', (data) => {
        console.log(`${packageName}: ${data}`);
      })
      deploy.on('close', (code) => {
        if (code > 0) {
          console.log(`Output for ${packageName}\n${output}`)
          return reject(new Error(`Deployment of ${packageName} failed`))
        }
        this.serverless.cli.log(`${packageName} succesfully deployed.`)
        resolve()
      });
    })
  }

  resolveVersions() {
    let res = []
    return Promise.all(
        this.stacks.map(s =>
          this.resolveVersion(s).then((v) => res.push({
            key: s,
            ...v
          }))
        )
      )
      .then(() => res)

  }

  resolveVersion(packageName) {
    let serverlessConfigPath = path.join(require.resolve(packageName), '..', 'serverless.yml');
    let serverlessConfig = yml.load(fs.readFileSync(serverlessConfigPath, {
      encoding: 'utf-8'
    }));
    let packageConfig = require(path.join(require.resolve(packageName), '..', 'package.json'))
    let name
    for (let mapping of serverlessConfig.mappings) {
      if (mapping.key.value === 'service') {
        name = mapping.value.rawValue
      }
    }
    let stackName = `${name}-${this.stage}`
    return listStackResources(this.aws, stackName, [], undefined)
      .then((resources) => {
        let bucketResource = resources.find(r => r.LogicalResourceId === RESOURCE_TO_TAG)
        return this.aws.request('S3', 'getBucketTagging', {
          Bucket: bucketResource.PhysicalResourceId
        })
      })
      .then(tags => {
        let versionTag = tags.TagSet.find(t => t.Key === VERSION_TAG_KEY)
        if (versionTag) {
          return {
            name: stackName,
            deployedVersion: versionTag.Value,
            localVersion: packageConfig.version
          }
        }
        return {
          name: stackName,
          localVersion: packageConfig.version
        }
      })
      .catch(e => ({
        name: stackName,
        localVersion: packageConfig.version
      }))
  }
}

module.exports = StackManager;
