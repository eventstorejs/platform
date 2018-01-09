const path = require('path');
const slsw = require('serverless-webpack');
const fs = require('fs');
const _ = require('lodash');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');


module.exports = {
  // devtool: 'cheap-source-map',
  devtool: 'inline-source-map',
  entry: slsw.lib.entries,
  externals: ['aws-sdk'],
  resolve: {
    extensions: [
      '.js',
      '.json',
      '.ts',
      '.tsx'
    ],
    modules: [
      '../../node_modules'
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(process.cwd(), '.webpack'),
    filename: '[name].js'
  },
  target: 'node',
  // externals: [nodeExternals({
  //   modulesDir: '../../node_modules'
  // })],
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: [/node_modules\/(?!@eventstorejs)/],
      loader: 'awesome-typescript-loader',
      query: {
        configFileName: path.join(__dirname, 'tsconfig.build.json'),
        transpileOnly: true,
        useBabel: false,
        useCache: true,
        presets: [
          [
            'env',
            {
              target: {
                node: 6.10
              }, // Node version on AWS Lambda
              useBuiltIns: true,
              modules: false,
              loose: true
            },
          ],
          'stage-0',
        ]
      }
    }]
  },
  plugins: [
    // new UglifyJsPlugin()
  ]
};
