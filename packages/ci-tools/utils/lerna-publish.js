// const {promisify} = require('util');
const {
  assign
} = require('lodash');
const semver = require('semver');
const {
  spawn
} = require('child_process');

function publish(pluginConfig, {
  nextRelease,
  options,
  logger
}) {
  return new Promise((resolve, reject) => {
    const deploy = spawn('node_modules/.bin/lerna', [
      'publish',
      '--yes',
      '--repo-version', nextRelease.version,
      '--message', `chore(release): publish version ${nextRelease.version}`,
      '--skip-git',
      '--force-publish',
      '--registry=https://registry.npmjs.org/'
    ], {
      cwd: process.cwd()
    });

    deploy.stdout.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    deploy.stderr.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    deploy.on('close', (code) => {
      if (code > 0) {
        return reject(`Deploy failed with exit code ${code}`);
      }
      return resolve();
    });
  })
}

module.exports = {
  publish
};
