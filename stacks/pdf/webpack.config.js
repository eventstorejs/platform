const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PermissionsOutputPlugin = require('webpack-permissions-plugin');
const CONFIG = require('@eventstorejs/config/stack/webpack.config');
module.exports = {
  ...CONFIG,
  plugins: [
    ...CONFIG.plugins || [],
    new CopyWebpackPlugin([{
      from: path.join(require.resolve('@eventstorejs/latex-binary'), '..', 'vendor'),
      to: 'node_modules/@eventstorejs/latex-binary/vendor'
    }]),
    new PermissionsOutputPlugin({
      // buildFolders: [{
      //   path: path.resolve(__dirname, path.join('.webpack', 'service', 'node_modules', '@eventstorejs', 'latex-binary', 'vendor')),
      //   fileMode: '777',
      //   dirMode: '666'
      // }]
      buildFiles: [{
        path: path.resolve(__dirname, path.join('.webpack', 'service', 'node_modules', '@eventstorejs', 'latex-binary', 'vendor', 'bin', 'x86_64-linux', `pdflatex`)),
        fileMode: '777'
      }]
    })
  ]
}
