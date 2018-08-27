'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');


module.exports = {
  mode: 'production',
  entry: {
    'vendor': './app/vendor.module.js',
    'app': './app/app.module.js',
    'enterprise': './app/enterprise.module.js'
  },
  output: {
    filename: 'static/libs/[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  },
    optimization: {
    runtimeChunk: 'single'
  },
  plugins: [
    new CleanWebpackPlugin('build'),
    new HtmlWebpackPlugin({
      template: './app/index.tpl.html',
      inject: 'head',
      filename: 'index.html',
      excludeAssets: [/enterprise.css/]
    }),
    new CopyWebpackPlugin([
      {
        from: './app/static/assets',
        to: 'static/assets'
          },
      {
        from: './app/static/i18n',
        to: 'static/i18n'
          },
      {
        from: './app/plugins',
        to: 'static/plugins'
          },
      {
        from: './app/conf',
        to: 'static/conf'
          },
      {
        from: './app/views',
        to: 'static/views'
          }
          ]),
    new MiniCssExtractPlugin({
      filename: 'static/styles/[name].css',
      chunkFilename: 'static/styles/[name].css'
    }),
    new HtmlWebpackExcludeAssetsPlugin(),
    new webpack.ProvidePlugin({
      CodeMirror: 'CodeMirror',
    }),
    new webpack.ProvidePlugin({
      analytics: 'analytics',
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery'
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: ['babel-loader']
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
           MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      // for fixing of loading bootstrap icon files
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader?limit=10000',
        options: {
          name: './static/fonts/[name].[ext]'
        }
      },
      {
        test: /\.(eot|ttf)$/,
        loader: 'file-loader',
        options: {
          name: './static/fonts/[name].[ext]'
        }
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  }
};
