import BabelGlobalAccessTrackerPlugin from './babel-global-access-tracker-plugin.js';

export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  plugins: [BabelGlobalAccessTrackerPlugin],
  metadataSubscribers: ['metadataHandler']
};