const webpack = require('webpack');
const {resolve} = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const OfflinePlugin = require('offline-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('deepmerge');

const getCustomConfig = require('./custom');
const config = require('./config');

const dirPath = process.cwd();
const mergeOpts = {arrayMerge: (a, b) => a.concat(b)};

const out = merge(merge(config, getCustomConfig(dirPath), mergeOpts), {

  output: {
    path: resolve(dirPath, 'dist'),
    filename: 'bundle-[hash].js'
  },

  module: {
    rules: [{
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [{
          loader: 'css-loader',
        }, {
          loader: 'sass-loader',
          options: {
            includePaths: [
              resolve(dirPath, 'src', 'styles'),
            ],
          },
        }, {
          loader: 'autoprefixer-loader',
        }],
      }),
    }],
  },

  plugins: [

    new ExtractTextPlugin('styles-[hash].css'),

    new CopyWebpackPlugin([{
      from: './static'
    }, {
      from: resolve(dirPath, 'static'),
    }]),

    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),

    new webpack.optimize.UglifyJsPlugin({sourceMap: false, compressor: {warnings: false}}),

    new ProgressBarPlugin(),

    new OfflinePlugin(),

  ],

}, mergeOpts);

if (process.env.DEBUGGING === 'true') {
  console.log(JSON.stringify(out, null, 2)); // eslint-disable-line
}

module.exports = out;
