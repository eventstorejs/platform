const fs = require('fs');
const path = require('path');
const changelog = require('generate-changelog');
const File = require('generate-changelog/lib/file')
const git = require('simple-git')(process.cwd());

async function writeChangelog(nextRelease) {
  const pkg = require(path.join(process.cwd(), 'package.json'));
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const newLogs = await changelog.generate({
    // [nextRelease.type] : true,
    repoUrl: pkg.repository
  });
  const oldLogs = await File.readIfExists(changelogPath);
  await File.writeToFile(changelogPath, newLogs + oldLogs);
}

function commitChangelog(nextRelease) {
  return new Promise((resolve, reject) => {
    git.add(['CHANGELOG.md'], (err) => {
      if(err) {
        return reject(err)
      }
      git.commit(`docs(changelog): Updated changelog for ${nextRelease.version} release`, (err) => {
        if(err) {
          return reject(err);
        }
        resolve()
      })
    })
  })
}

async function publish(pluginConfig, {nextRelease, options, logger}) {
  await writeChangelog(nextRelease);
  await commitChangelog(nextRelease);
}

module.exports = {publish};
