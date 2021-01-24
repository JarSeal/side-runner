const webpack = require('webpack');

const commonPaths = require('./paths');

module.exports = {
  mode: 'development',
  output: {
    filename: '[name].js',
    path: commonPaths.outputPath,
    publicPath: 'http://localhost:3000/',
    chunkFilename: '[name].js',
  },
  devServer: {
    contentBase: commonPaths.outputPath,
    disableHostCheck: true,
    compress: true,
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
};