#!/usr/bin/env node

import { resolve as pathResolve, extname } from 'path';
import { readFile, access, unlink } from 'fs/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import webpack from 'webpack';
import WebpackGlobalAccessCollectorPlugin from '../webpack-global-access-collector-plugin.js';
import BabelGlobalAccessTrackerPlugin from '../babel-global-access-tracker-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, '..');

async function getPackageMain(packageName) {
  try {
    const packagePath = pathResolve(process.cwd(), 'node_modules', packageName, 'package.json');
    await access(packagePath);
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
    return packageJson.main;
  } catch (error) {
    try {
      execSync(`npm install ${packageName} --no-save`, { stdio: 'inherit' });
      const packagePath = pathResolve(process.cwd(), 'node_modules', packageName, 'package.json');
      const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
      return packageJson.main;
    } catch (installError) {
      throw new Error(`Failed to install or find package ${packageName}: ${installError.message}`);
    }
  }
}

function createWebpackConfig(entryPath) {
  return {
    entry: entryPath,
    mode: 'development',
    output: {
      filename: 'bundle.js',
      path: pathResolve(__dirname, '../tmp'),
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: pathResolve(projectRoot, 'node_modules/babel-loader'),
              options: {
                metadataSubscribers: ['metadataHandler'],
                presets: ['@babel/preset-env'],
                plugins: [BabelGlobalAccessTrackerPlugin],
                babelrc: false,
                configFile: false,
              },
            },
            {
              loader: pathResolve(projectRoot, 'node_modules/ts-loader'),
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.js$/,
          loader: pathResolve(projectRoot, 'node_modules/babel-loader'),
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
      extensions: ['.ts', '.js'],
      modules: [
        pathResolve(projectRoot, 'node_modules'),
        'node_modules'
      ],
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

async function runWebpack(entryPath) {
  const config = createWebpackConfig(entryPath);
  
  return new Promise((resolve, reject) => {
    webpack(config, async (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error('Webpack compilation failed:');
        if (err) {
          console.error(err);
        }
        if (stats && stats.hasErrors()) {
          console.error(stats.toString({
            colors: true,
            errorDetails: true
          }));
        }
        reject(err || new Error('Webpack compilation failed'));
        return;
      }

      try {
        const bundlePath = pathResolve(projectRoot, 'tmp/bundle.js');
        await unlink(bundlePath);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete bundle.js file:', cleanupError.message);
      }
      
      resolve();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error('Usage: global-api-audit-js <package-name-or-file-path>');
    console.error('');
    console.error('Arguments:');
    console.error('  package-name-or-file-path  Either an NPM package name or path to a JS source file');
    console.error('');
    console.error('Examples:');
    console.error('  global-api-audit-js lodash');
    console.error('  global-api-audit-js ./src/main.js');
    process.exit(1);
  }

  const input = args[0];
  let entryPath;

  try {
    const isRelativePath = input.startsWith('./') || input.startsWith('../');
    const isAbsolutePath = input.startsWith('/');
    const hasFileExtension = extname(input) === '.js' || extname(input) === '.ts';
    const hasPathSeparators = input.includes('/') || input.includes('\\');
    
    const looksLikeNpmPackage = !isRelativePath && !isAbsolutePath && !hasFileExtension && 
                                (input.includes('/') ? input.startsWith('@') || !input.startsWith('.') : true);
    
    if (isRelativePath || isAbsolutePath || hasFileExtension || (hasPathSeparators && !looksLikeNpmPackage)) {
      entryPath = pathResolve(process.cwd(), input);
    } else {
      const mainFile = await getPackageMain(input);
      if (!mainFile) {
        throw new Error(`Package ${input} does not have a main entry point`);
      }
      entryPath = pathResolve(process.cwd(), 'node_modules', input, mainFile);
    }

    await runWebpack(entryPath);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
