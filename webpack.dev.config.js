'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    'vendor': './app/vendor.module.js',
    'app': './app/app.module.js',
  },
  output: {
    filename: 'static/libs/[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  },
    optimization: {
    runtimeChunk: 'single'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './app/index.tpl.html',
      inject: 'head',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({patterns: [
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
      ]}
    ),
    new MiniCssExtractPlugin({
      filename: 'static/styles/[name].css',
      chunkFilename: 'static/styles/[name].css'
    }),
    new webpack.ProvidePlugin({
      CodeMirror: 'CodeMirror',
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
        loader: 'babel-loader',
        options: {}
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: {} },
          { loader: 'sass-loader', options: {} },
        ]
      },
      // for fixing of loading bootstrap icon files
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          name: './static/fonts/[name].[ext]',
          limit: 10000
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
        loader: 'html-loader',
        options: {}
      }
    ]
  },
  devServer: {
    host: 'localhost',
    port: 9000,
    static: [
      {
        directory: path.join(__dirname, 'app'),
        serveIndex: true,
        watch: true,
      }
    ],
    historyApiFallback: true,
    compress: false,
    hot: true,
  },
};
