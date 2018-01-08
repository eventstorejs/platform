const lerna = require('lerna/lib/PackageUtilities');
const path = require('path');
const exec = require('child-process-promise').exec;
const Promise = require('bluebird');

const rootPath = path.join(__dirname, '..', '..')

let packages = lerna.getPackages({
    packageConfigs: require(path.join(rootPath, 'package.json')).workspaces,
    rootPath
  })
  .map((p) => p.location)
  .map((p) => exec(`cd ${p} && yarn link`))

  return Promise.all(packages)
