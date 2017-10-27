const webpack = require('webpack');
const {dirname, resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTemplate = require('html-webpack-template');

const ocularPath = resolve(dirname(__filename), '..');
const appPath = resolve(ocularPath, '..', '..');

const htmlConfig = require(resolve(appPath, 'html.config.js'));

const BABEL_CONFIG = {
  presets: [
    'es2015',
    'stage-2',
    'react'
  ].map(name => require.resolve(`babel-preset-${name}`)),
  plugins: [
    'transform-decorators-legacy'
  ].map(name => require.resolve(`babel-plugin-${name}`))
};

module.exports = {

  entry: ['babel-polyfill', 'whatwg-fetch', './base/main'],

  module: {
    noParse: /(mapbox-gl)\.js$/,

    rules: [{
      test: /\.md$/,
      use: 'raw-loader',
    }, {
      test: /\.csv$/,
      loader: 'csv-loader',
      options: {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
      },
    }, {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules\/(?!(ocular)\/).*/,
      options: BABEL_CONFIG,
    }, {
      test: /\.(eot|svg|ttf|woff|woff2|gif|jpe?g|png)$/,
      loader: 'url-loader?limit=100000',
    }],
  },

  resolve: {
    modules: [
      resolve(appPath, 'src'),
      resolve(appPath, 'node_modules'),
      resolve(ocularPath, '../base'),
      resolve(ocularPath, '../node_modules'),
    ],
  },

  plugins: [

    new HtmlWebpackPlugin(Object.assign({

      inject: false,
      template: HtmlWebpackTemplate,
      appMountId: 'root',
      mobile: true,

      links: [{
        rel: 'icon',
        type: 'img/ico',
        href: 'favicon.ico',
      }, 'https://d1a3f4spazzrp4.cloudfront.net/uber-fonts/3.1.0/refresh.css'],

    }, htmlConfig)),

    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        MapboxAccessToken: JSON.stringify(
          process.env.MapboxAccessToken || process.env.MAPBOX_TOKEN
        ),
      },
    }),

  ],

  node: {
    fs: 'empty',
  },

};
