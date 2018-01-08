const fs = require('fs');
const path = require('path');
const git = require('simple-git')(process.cwd());

function pushChanges() {
  return new Promise((resolve, reject) => {
    git.push('origin', 'master', (err) => {
      if (err) {
        return reject(err);
      }
      git.pushTags('origin', (err) => {
        if (err) {
          return reject(err);
        }
        resolve()
      })
    })
  })
}

async function publish(pluginConfig, {
  nextRelease,
  options,
  logger
}) {
  await pushChanges();
}

module.exports = {
  publish
};
