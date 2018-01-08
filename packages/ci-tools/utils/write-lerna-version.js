const fs = require('fs');
const path = require('path');

function writeVersion(filePath, version) {
  let pkg = JSON.parse(fs.readFileSync(filePath, {encoding: 'utf-8'}));
  pkg.version = version;
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2), {encoding: 'utf-8'})
}

async function publish(pluginConfig, {nextRelease, lastRelease, options, logger}) {
  let lernaPath = path.join(process.cwd(), 'lerna.json')
  writeVersion(lernaPath, lastRelease.version)
  return Promise.resolve()
}

module.exports = {publish};
