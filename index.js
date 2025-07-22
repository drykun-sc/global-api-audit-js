#!/usr/bin/env node

export { default as WebpackGlobalAccessCollectorPlugin } from './webpack-global-access-collector-plugin.js';
export { default as BabelGlobalAccessTrackerPlugin } from './babel-global-access-tracker-plugin.js';
export { main } from './bin/global-api-audit-js.js'; 