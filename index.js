#!/usr/bin/env node

import { default as main } from './src/global-api-audit-js.js';

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});