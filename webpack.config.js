import { resolve as _resolve } from 'path';
import { fileURLToPath } from 'url';
import WebpackGlobalAccessCollectorPlugin from './webpack-global-access-collector-plugin.js';
import BabelGlobalAccessTrackerPlugin from './babel-global-access-tracker-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = _resolve(__filename, '..');

export default {
  entry: './test.js',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: _resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              metadataSubscribers: ['metadataHandler'],
              plugins: [BabelGlobalAccessTrackerPlugin],
              babelrc: false,
              configFile: false,
            },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          metadataSubscribers: ['metadataHandler'],
          plugins: [BabelGlobalAccessTrackerPlugin],
          babelrc: false,
          configFile: false,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: false,
  optimization: {
    minimize: false,
  },
  plugins: [
    new WebpackGlobalAccessCollectorPlugin(),
  ],
};