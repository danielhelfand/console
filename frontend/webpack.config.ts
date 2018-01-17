/* eslint-env node */

import * as webpack from 'webpack';
import * as path from 'path';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const NODE_ENV = process.env.NODE_ENV;

/* Helpers */
const gitHash = () => require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
const extractSass = new ExtractTextPlugin({filename: 'app-bundle.css'});

let config: webpack.Configuration = {
  entry: {
    app:  './public/components/app.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  resolve: {
    extensions: ['.glsl', '.ts', '.tsx', '.js', '.jsx'],
  },
  node: {
    fs: 'empty',
  },
  module: {
    rules: [
      { test: /\.glsl$/, loader: 'raw!glslify' },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: {
              // Leave one core spare for fork-ts-checker-webpack-plugin
              workers: require('os').cpus().length - 1,
            }
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true, // This implicitly enables transpileOnly! No type checking!
              transpileOnly: true, // fork-ts-checker-webpack-plugin takes care of type checking
            }
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: extractSass.extract({
          use: [
            { loader: 'cache-loader' },
            { loader: 'thread-loader' },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              }
            },
            {
              loader: 'resolve-url-loader',
              options: {
                sourceMap: true,
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                outputStyle: 'compressed',
              }
            },
          ],
          publicPath: './',
        })
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
        },
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify(NODE_ENV)}),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({resource}) => {
        if (resource && (/^.*\.(css|scss)$/).test(resource)) {
          return false;
        }
        return /node_modules/.test(resource);
      },
    }),
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
    extractSass,
    new HtmlWebpackPlugin({
      filename: './tokener.html',
      template: './public/tokener.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './public/index.html',
      production: NODE_ENV === 'production',
    }),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  ],
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
};

/* Production settings */
if (NODE_ENV === 'production') {
  config.output.filename = `[name]-bundle.${gitHash()}.min.js`;
  config.output.chunkFilename = `[name]-[chunkhash].${gitHash()}.min.js`;
  extractSass.filename = `app-bundle.${gitHash()}.min.css`;
  config.plugins = config.plugins.concat([
    new UglifyJsPlugin({sourceMap: true}),
  ]);
  config.stats = 'normal';
}

export default config;