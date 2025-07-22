#!/usr/bin/env node

import { resolve as pathResolve, extname } from 'path';
import { readFile, access, unlink } from 'fs/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import webpack from 'webpack';
import { createWebpackConfig } from './webpack-config.js';

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

async function runWebpack(entryPath) {
  const config = createWebpackConfig(entryPath, projectRoot, __dirname);
  
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

export { main as default }; 