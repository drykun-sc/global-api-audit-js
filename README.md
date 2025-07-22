# global-api-audit-js

A JavaScript tool for auditing projects to detect global API usage. This package provides a command-line interface for identifying global object access in JavaScript/TypeScript projects. The main goal of this tool is to help porting JS code to different execution environments.

## Features

- 🔍 **Static Analysis**: Analyzes JavaScript and TypeScript files for global API usage
- 🛠️ **Webpack Integration**: Webpack plugin for build-time analysis
- ⚡ **Babel Integration**: Babel plugin for AST-based analysis
- 🎯 **CLI Tool**: Easy-to-use command-line interface

## Installation

```bash
npm install -g global-api-audit-js
```

Or install locally:

```bash
npm install global-api-audit-js
```

## Usage

```bash
# Analyze a specific file
global-api-audit-js path/to/your/file.js

# Analyze a NPM package
global-api-audit-js @namespace/package
```

## Or Simply Run with NPX
No installation needed.

```bash
# Analyze a specific file
npx global-api-audit-js path/to/your/file.js

# Analyze a NPM package
npx global-api-audit-js @namespace/package
```

## Configuration

No additional configuration is required.

## Output Format

```json
{
  "files": [
    {
      "file": "path/file1.js",
      "globalAPIs": [
        "require",
        "console"
      ],
      "NodeAPIs": [
        "https",
        "url",
        "https.request",
        "url.parse"
      ]
    },
    {
      "file": "path/file2.js",
      "globalAPIs": [
        "clearTimeout",
        "setTimeout"
      ]
    }
  ],
  "aggregated": {
    "globalAPIs": [
        "require",
        "console",
        "clearTimeout",
        "setTimeout"
    ],
    "NodeAPIs": [
        "https",
        "url",
        "https.request",
        "url.parse"
    ]
  }
}
```
