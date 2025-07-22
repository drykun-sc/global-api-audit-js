import BabelGlobalAccessTrackerPlugin from './babel-global-access-tracker-plugin.js';
import WebpackGlobalAccessCollectorPlugin from './webpack-global-access-collector-plugin.js';

export function createWebpackConfig(entryPath, outputDirName, outputFileName) {
  return {
    entry: entryPath,
    mode: 'development',
    output: {
      filename: outputFileName,
      path: outputDirName,
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
                presets: ['@babel/preset-env'],
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
            presets: ['@babel/preset-env'],
            plugins: [BabelGlobalAccessTrackerPlugin],
            babelrc: false,
            configFile: false,
          },
        },
      ],
    },
    resolve: {
      fallback: {
        "http": false,
        "https": false,
        "url": false,
        "fs": false,
        "path": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "buffer": false,
        "querystring": false,
        "zlib": false,
        "events": false,
        "assert": false,
        "constants": false,
        "domain": false,
        "punycode": false,
        "string_decoder": false,
        "timers": false,
        "tty": false,
        "vm": false,
        "worker_threads": false,
        "child_process": false,
        "cluster": false,
        "dgram": false,
        "dns": false,
        "http2": false,
        "net": false,
        "perf_hooks": false,
        "readline": false,
        "repl": false,
        "tls": false,
        "trace_events": false,
        "v8": false,
        "wasi": false
      }
    },
    devtool: 'inline-source-map',
    plugins: [
      new WebpackGlobalAccessCollectorPlugin(),
    ],
  };
} 