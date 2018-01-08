const path = require('path');
const git = require('simple-git')(process.cwd());
const isCI = require('is-ci');

git.status((err, status) => {
  if (isCI) {
    console.log(`Is CI not preventing master commit`)
  } else if (status.current === 'master') {
    throw new Error(`Can not commit to master. Create a branch to commit`)
  }
})
