// Karma configuration
// Generated on Mon Jan 29 2018 16:16:53 GMT+0100 (CET)
const webpack = require('webpack');
var karmaWebpack = require('karma-webpack');
var webpackConfig = require('./webpack.dev.config.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      karmaWebpack,
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-coverage',
      'karma-mocha-reporter',
      'codecov'
    ],
    files: [
          'node_modules/jquery/dist/jquery.js',
          'node_modules/angular/angular.js',
          'node_modules/angular-mocks/angular-mocks.js',
          'app/vendor.module.js',
          'app/app.module.js',
          'app/tests/**/**.test.js',
        ],
    preprocessors: {
      './app/*.js': [ 'coverage' ],
      './app/**/**.js': [ 'webpack', 'coverage' ],
      './app/tests/**/**.test.js': ['webpack'],
    },
    webpack: {
      mode: 'development',
      module: webpackConfig.module,
      plugins: webpackConfig.plugins
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    reporters: ['mocha', 'progress', 'coverage'],
    coverageReporter: {
      // specify a common output directory
      dir: 'app/tests/coverage',
      reporters: [
        {
          type: 'html',
          subdir: 'html'
        },
        {
          type: 'lcovonly',
          subdir: 'lcov'
        },
        {
          type: 'cobertura',
          subdir: 'cobertura'
        }
          ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  })
}
