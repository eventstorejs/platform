// const {promisify} = require('util');
const {
  assign
} = require('lodash');
const semver = require('semver');
const git = require('simple-git')(process.cwd());

function verifyConditions() {
  return new Promise((resolve, reject) => {
    git.status((err, status) => {
      if (err) {
        return reject(err);
      }
      if (status.current === 'master') {
        return resolve();
      }
      reject(new Error(`Can only release on master`));
    })
  })
}

module.exports = {
  verifyConditions
};
