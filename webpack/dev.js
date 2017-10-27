const webpack = require('webpack');
const merge = require('deepmerge');
const {resolve} = require('path');

const config = require('./config');
const getCustomConfig = require('./custom');

const dirPath = process.cwd();
const mergeOpts = {arrayMerge: (a, b) => a.concat(b)};

const out = merge(merge(config, getCustomConfig(dirPath), mergeOpts), {

  devtool: 'inline-source-maps',

  entry: [
    'react-hot-loader/patch',
  ],

  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: 'style-loader',
      }, {
        loader: 'css-loader',
        options: {sourceMap: true},
      }, {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
          includePaths: [
            resolve(dirPath, 'src', 'styles'),
          ],
        },
      }, {
        loader: 'autoprefixer-loader',
      }],
    }],
  },

  devServer: {
    hot: true,
    contentBase: ['./static', resolve(dirPath, 'static')],
    historyApiFallback: true,
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],

}, mergeOpts);

if (process.env.DEBUGGING === 'true') {
  console.log(JSON.stringify(out, null, 2)); // eslint-disable-line
}

module.exports = out;
