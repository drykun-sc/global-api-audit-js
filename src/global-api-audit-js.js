#!/usr/bin/env node

import { join } from 'path';
import { readFileSync, accessSync, rmSync, mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import webpack from 'webpack';
import { createWebpackConfig } from './webpack-config.js';

function createTempDir() {
    return mkdtempSync(join(tmpdir(), 'global-api-audit-js'));
}

function deleteTempDir(dirPath) {
    try {
        rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
        console.warn('Warning: Could not delete temp directory:', error.message);
    }
}

function printUsage() {
    console.error('Usage: global-api-audit-js <package-name-or-file-path>');
    console.error('');
    console.error('Arguments:');
    console.error('  package-name-or-file-path  Either an NPM package name or path to a JS source file');
    console.error('');
    console.error('Examples:');
    console.error('  global-api-audit-js lodash');
    console.error('  global-api-audit-js ./src/main.js');
}

function tryExistingPackage(packageName) {
    let packagePath = join(process.cwd(), 'node_modules', packageName);
    if (!existsSync(packagePath)) {
        return null;
    }
    return packagePath;
}

function tryInstallingPackage(packageName, tempDirPath) {
    const originalCwd = process.cwd();
    process.chdir(tempDirPath);
    execSync(`npm install ${packageName} --no-save`, { stdio: 'inherit' });
    process.chdir(originalCwd);
    return join(tempDirPath, 'node_modules', packageName);
}

function getPackageMain(packagePath) {
    const packageJsonPath = join(packagePath, 'package.json');
    accessSync(packageJsonPath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const mainFile = packageJson.main;
    if (!mainFile) {
        throw new Error(`Package ${packageName} does not have a main entry point`);
    }
    return join(packagePath, mainFile);
}

function handlePackage(packageName, tempDirPath) {
    // try to resolve as an existing package
    let packagePath = tryExistingPackage(packageName);
    if (!packagePath) {
        // try to install the package in the temp directory
        packagePath = tryInstallingPackage(packageName, tempDirPath);
    }

    if (!packagePath) {
        throw new Error(`Failed to resolve package ${packageName}`);
    }

    return getPackageMain(packagePath);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 1) {
        printUsage();
        process.exit(1);
    }

    const input = args[0];

    const tempDirPath = createTempDir();

    try {
        // trying to resolve as a source file relative to the current working directory
        let entryPath = join(process.cwd(), input);
        if (!existsSync(entryPath)) {
            // assuning this is a package name
            entryPath = handlePackage(input, tempDirPath);
        }
        if (existsSync(entryPath)) {
            const config = createWebpackConfig(entryPath, tempDirPath, 'bundle.js');
        
            webpack(config, async (err, stats) => {
                if (err || stats.hasErrors()) {
                    console.error('Webpack compilation failed:');
                    if (err) {
                        console.error(err);
                    }
                    if (stats && stats.hasErrors()) {
                        console.error(stats.toString({colors: true, errorDetails: true}));
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    finally {
        deleteTempDir(tempDirPath);
    }
}

export { main as default }; 