const {promisify} = require('util');
const {assign} = require('lodash');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

module.exports = async function({retry} = {}, {pkg, npm, options}, cb) {
  let lernaConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lerna.json'), {encoding: 'utf-8'}))
  return {
    version: lernaConfig.version
  };
};
