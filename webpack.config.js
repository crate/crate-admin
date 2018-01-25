const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');

const config = {
  entry: {
    'vendor': './app/vendor.module.js',
    'app': './app/app.module.js',
    'enterprise': './app/enterprise.module.js'
  },
  output: {
    filename: 'static/libs/[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: [{
          loader: 'ng-annotate-loader',
          options: {
            es6: true
          }
        }, 'babel-loader', 'jshint-loader']
      },
      {
        test: /\.(scss)$/,
        use: ExtractTextWebpackPlugin.extract({
          use: [
            {
              loader: "css-loader",
              options: {
                minimize: true
              }
              },
            {
              loader: "sass-loader"
              }
          ]
        })
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
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      comments: false
    }), // for mifiying js
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'static/libs/[name].bundle.js'
    }),
    new CleanWebpackPlugin('build'),
    new HtmlWebpackPlugin({
      template: './app/index.html',
      excludeAssets: [/enterprise.css/]
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery'
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
    new webpack.ProvidePlugin({
      CodeMirror: 'CodeMirror',
    }),
    new webpack.ProvidePlugin({
      analytics: 'analytics',
    }),
    new ExtractTextWebpackPlugin("static/styles/[name].css", {
      allChunks: false
    }),
    new OptimizeCssAssetsWebpackPlugin({
      assetNameRegExp: /\.app\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: {
        discardComments: {
          removeAll: true
        }
      },
      canPrint: true
    }),
    new HtmlWebpackExcludeAssetsPlugin()
  ],
  devServer: {
    port: 9000,
    contentBase: './app/',
    historyApiFallback: true
  }
};

module.exports = config;
