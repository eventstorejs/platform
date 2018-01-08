const lerna = require('lerna/lib/PackageUtilities');
const path = require('path');
const exec = require('child-process-promise').exec;
const Promise = require('bluebird');

const rootPath = path.join(__dirname, '..', '..')

let packages = lerna.getPackages({
    packageConfigs: require(path.join(rootPath, 'package.json')).workspaces,
    rootPath
  })
  .filter((p) => p.location.indexOf(path.join(rootPath, 'apis')) < 0)
  .map((p) => p._package);

let packageMap = packages.reduce((p, c, i) => {
  p[c.name] = c;
  return p;
}, {});

// console.log(packages)
console.log(`Resolved to ${packages.length} packages`)

const buildOrder = [];

let current = 0;
while (packages.length > 0) {
  let p = packages[current];
  let hasAllDeps = true
  if (p.dependencies) {
    for (let d in p.dependencies) {
      if (packageMap[d]) { //else: not our dep ignore
        if (buildOrder.indexOf(d) < 0) { // else has dep but is in build order
          // has internal dep but not already build
          current++;

          if (current > packages.length) {
            throw new Error(`Recusrive dep`);
          }
          hasAllDeps = false;
          break;
        }
      }
    }
    if (!hasAllDeps) {
      continue;
    }
    // done. no deps or all already build
  }
  buildOrder.push(p.name);
  // console.log(`Add: ${p.name} as build`)
  packages.splice(current, 1);
  current = 0
}

return Promise.each(buildOrder, (p, index, length) =>
  exec(`lerna --scope ${p} run -- build`)
  .then(() => {
    console.log(`Succesfully build: ${p}`);
    return Promise.resolve()
  })
  .catch(e => {
    console.log(`Build failed`, e);
    process.exit(1);
  })
)
