const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, config) => {
  return {
    mode: 'production',
    entry: {
      main: path.resolve(__dirname, './src/js/main.js'),
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].bundle.js',
      publicPath: '/',
      assetModuleFilename: '[name][ext][query]',
    },
    optimization: {
      minimize: false, // Disable minification because it breaks exceljs for some reason
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './src/index.html'), // Template file
        filename: 'index.html', // Output file
      }),
      new CleanWebpackPlugin(),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'data', to: 'data', noErrorOnMissing: true }, // Adjust path as needed
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.html$/,
          use: ['html-loader'],
        },
        {
          test: /\.webmanifest$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'site.webmanifest',
                outputPath: '/',
              },
            },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            'source-map-loader', 
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: {
                        // Conservative browser targets for compatibility
                        browsers: [
                          "last 2 versions", // Last 2 versions of all browsers
                          "ie >= 11", // Support for Internet Explorer 11
                          "safari >= 9", // Older Safari versions
                          "> 0.2%", // Browsers with >0.2% market share
                          "not dead", // Avoid dead browsers (no updates for over 24 months)
                        ],
                      },
                      useBuiltIns: 'entry', // Polyfill features used in your code
                      corejs: '3.32', // Ensure compatibility with CoreJS 3.x
                      modules: false, // Don't transpile ES modules (let Webpack handle it)
                      debug: false, // Set to `true` if you want to log Babel transformations
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf|)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.(css)$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(scss)$/i,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
      ],
    },
    devServer: {
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'dist'),
      }
    },
  };
};
