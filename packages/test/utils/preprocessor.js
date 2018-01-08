const tsc = require('typescript');
const path = require('path');
const fs = require('fs')

const parsedConfig = tsc.parseJsonConfigFileContent(
  require(path.join(process.cwd(), 'tsconfig.json')),
  tsc.sys,
  path.join(process.cwd())
);

module.exports = {
  process(src, filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return tsc.transpile(src, parsedConfig.options, filePath, []);
    }
    return src;
  }
};
