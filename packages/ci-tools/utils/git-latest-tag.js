const lastSemver = require('git-latest-semver-tag');

module.exports = async function ({
  retry
} = {}, {
  pkg,
  npm,
  options
}) {
  return new Promise((resolve, reject) => {
    lastSemver((err, tag) => {
      if (err) {
        return reject(err);
      }
      resolve({
        version: tag
      })
    })
  })
};
