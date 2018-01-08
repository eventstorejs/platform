const resolve = require('resolve');
const path = require('path');

/* This option allows the use of a custom resolver.
 This resolver must be a node module that exports a function expecting a string as the first argument for the
 path to resolve and an object with the following structure as the second argument:
 {
  "basedir": string,
  "browser": bool,
  "extensions": [string],
  "moduleDirectory": [string],
  "paths": [string],
  "rootDir": [string]
}
The function should either return a path to the module that should be resolved or throw an error if the module can't be found.

 */
module.exports = (filePath, data) => {

  // TODO obviously not working for anyone. try to do it with lerna config
  if (filePath.indexOf('@eventstorejs') === 0) {
    let modifiedPath = filePath
    let packageName = filePath.split('/')[1]
    if (packageName === 'latex-binary') {
      //do nothing
    } else {
      modifiedPath = path.join(process.cwd(), 'packages', packageName, 'src', 'index.ts')
    }
    return resolve.sync(modifiedPath, data)
  } else {
    return resolve.sync(filePath, data);
  }
}
