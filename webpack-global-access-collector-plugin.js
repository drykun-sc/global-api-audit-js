class WebpackGlobalAccessCollectorPlugin {

  constructor() {
    this.fileAccesses = new Map(); // Map of file path to Set of API names
    this.allGlobalAccesses = new Set();
    this.nodeModuleAccesses = new Map(); // Map of file path to Set of Node.js core module names
    this.allNodeModuleAccesses = new Set();
  }

  apply(compiler) {
    const pluginInstance = this;
    compiler.hooks.compilation.tap(
      'WebpackGlobalAccessCollectorPlugin',
      (compilation) => {
        const { NormalModule } = compilation.compiler.webpack;
        NormalModule.getCompilationHooks(compilation).loader.tap(
          'WebpackGlobalAccessCollectorPlugin',
          (loaderContext, module) => {
            loaderContext.metadataHandler = function(metadata) {
              if (metadata && metadata.globalIdentifiersAccesses) {
                if (metadata.globalIdentifiersAccesses.size > 0) {
                  const filePath = loaderContext.resourcePath;
                  // Drop leading path components up to and including node_modules/
                  const normalizedFilePath = filePath.replace(/^.*?node_modules\//, '');
                  
                  if (!pluginInstance.fileAccesses.has(normalizedFilePath)) {
                    pluginInstance.fileAccesses.set(normalizedFilePath, new Set());
                  }
                  
                  metadata.globalIdentifiersAccesses.forEach(access => {
                    pluginInstance.fileAccesses.get(normalizedFilePath).add(access);
                    pluginInstance.allGlobalAccesses.add(access);
                  });
                }
              }
              
              if (metadata && metadata.nodeCoreModulesAccesses) {
                if (metadata.nodeCoreModulesAccesses.size > 0) {
                  const filePath = loaderContext.resourcePath;
                  // Drop leading path components up to and including node_modules/
                  const normalizedFilePath = filePath.replace(/^.*?node_modules\//, '');
                  
                  if (!pluginInstance.nodeModuleAccesses.has(normalizedFilePath)) {
                    pluginInstance.nodeModuleAccesses.set(normalizedFilePath, new Set());
                  }
                  
                  metadata.nodeCoreModulesAccesses.forEach(access => {
                    pluginInstance.nodeModuleAccesses.get(normalizedFilePath).add(access);
                    pluginInstance.allNodeModuleAccesses.add(access);
                  });
                }
              }
            };
          }
        );
      });

    compiler.hooks.afterEmit.tapAsync(
      'WebpackGlobalAccessCollectorPlugin',
      (compilation, callback) => {
        const files = [];
        for (const [filePath, globalAPIs] of this.fileAccesses) {
          const nodeAPIs = this.nodeModuleAccesses.get(filePath) || new Set();
          const fileObj = {
            file: filePath
          };
          
          if (globalAPIs.size > 0) {
            fileObj.globalAPIs = [...globalAPIs];
          }
          
          if (nodeAPIs.size > 0) {
            fileObj.NodeAPIs = [...nodeAPIs];
          }
          
          files.push(fileObj);
        }
        
        const aggregated = {};
        
        if (this.allGlobalAccesses.size > 0) {
          aggregated.globalAPIs = [...this.allGlobalAccesses];
        }
        
        if (this.allNodeModuleAccesses.size > 0) {
          aggregated.NodeAPIs = [...this.allNodeModuleAccesses];
        }
        
        const dataToSave = {
          files: files,
          aggregated: aggregated
        };
        
        console.log(JSON.stringify(dataToSave, null, 2));
        
        callback();
      }
    );
  }
}

export default WebpackGlobalAccessCollectorPlugin;