const { merge } = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa-react');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const fs = require('fs');
const DotenvWebpack = require('dotenv-webpack');
const Dotenv = require('dotenv');

const deps = require('./package.json').dependencies;

module.exports = (webpackConfigEnv, argv) => {
  const currentDirectory = fs.realpathSync(process.cwd());
  
  let envPath = '.env'
  if(process.env.ENV) {
    envPath=`${envPath}.${process.env.ENV}`
  }

  const env = new DotenvWebpack({
    path: path.resolve(currentDirectory, envPath),
  });

  const singleSpaOptions = {
    orgName: 'betterplace',
    projectName: 'custom-workflow-ui',
    webpackConfigEnv,
    argv,
  };

  const defaultConfig = singleSpaDefaults(singleSpaOptions)

  Dotenv.config({
    path: env.config.path,
  });

  defaultConfig.devServer = {
    port: 8092,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };

  defaultConfig.module.rules = [
    {
      test: /\.(js|jsx)$/,
      include: path.resolve(currentDirectory, 'src'),
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            ['module-resolver', {
              root: ['./src'],
            }]
          ],
          cacheDirectory: true,
        },
      },
    },
    {
      test: /\.js\.map$/,
      enforce: 'pre',
      use: [
        {
          loader: 'file-loader',
          options: {
            esModule: false,
          },
        },
      ],
    },
    {
      test: /\.css$/i,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            esModule: false,
          },
        },
      ],
    },
    {
      test: /\.(png|jpg|gif|svg|webp)$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8192,
            esModule: false,
          },
        },
      ],
    },
    {
      test: /\.module\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]__[local]',
            },
          },
        },
        'sass-loader',
      ],
    },
    {
      test: /.scss$/,
      exclude: /\.module\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              compileType: 'icss',
            },
          },
        },
        'sass-loader',
      ],
    },
    {
      test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
      ],
    },
  ];

  defaultConfig.externals = defaultConfig.externals.filter((lib) => !['react', 'react-dom'].includes(lib));

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    devtool: 'source-map',
    output: {
      filename: `${singleSpaOptions.orgName}-${singleSpaOptions.projectName}.[contenthash].js`,
      publicPath: process.env.PUBLIC_PATH,
    },
    plugins: [
      env,
      new ModuleFederationPlugin({
        name: 'betterplace_custom_workflow_ui',
        filename: 'remoteEntry.js',
        exposes: {
          './mfeRoot': './src/betterplace-custom-workflow-ui',
        },
        shared: {
          react: {
            strictVersion: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            strictVersion: true,
            requiredVersion: deps['react-dom'],
          },
        },
      }),
    ],
    resolve: {
      fallback: {
        zlib: require.resolve('browserify-zlib'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        util: require.resolve('util'),
        url: require.resolve('url'),
        
      },
    },
    target: ['web', 'es5'],
  });
};
