// Karma configuration
// Generated on Mon Jan 29 2018 16:16:53 GMT+0100 (CET)
var webpack = require('karma-webpack');
var babel = require('karma-babel-preprocessor');
var webpackConfig = require('./webpack.config.js');
const commonsChunkPluginIndex = webpackConfig.plugins.findIndex(plugin => plugin.chunkNames);
webpackConfig.plugins.splice(commonsChunkPluginIndex, 1);


webpackConfig.entry = null;

webpackConfig.module.loaders = [
  {
    test: /\.js$/,
    exclude: /(node_modules)/,
    loader: 'babel-loader'
  }
];

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      webpack,
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-coverage',
      'karma-mocha-reporter',
      'karma-babel-preprocessor',
      'codecov.io'
    ],
    files: [
      './app/vendor.module.js',
      './app/app.module.js',
      './node_modules/angular-mocks/angular-mocks.js',
      './app/tests/**/**.test.js'
    ],
    preprocessors: {
      './app/vendor.module.js': ['webpack'],
      './app/app.module.js': ['webpack'],
      './app/tests/**/**.test.js': ['babel'],
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
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
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity
  })
}
