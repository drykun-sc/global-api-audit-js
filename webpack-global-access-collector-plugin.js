class WebpackGlobalAccessCollectorPlugin {

  constructor() {
    this.fileAccesses = new Map(); // Map of file path to Set of API names
    this.allGlobalAccesses = new Set();
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
              if (metadata && metadata.currentFileAccesses) {
                if (metadata.currentFileAccesses.size > 0) {
                  const filePath = loaderContext.resourcePath;
                  // Drop leading path components up to and including node_modules/
                  const normalizedFilePath = filePath.replace(/^.*?node_modules\//, '');
                  
                  if (!pluginInstance.fileAccesses.has(normalizedFilePath)) {
                    pluginInstance.fileAccesses.set(normalizedFilePath, new Set());
                  }
                  
                  metadata.currentFileAccesses.forEach(access => {
                    pluginInstance.fileAccesses.get(normalizedFilePath).add(access);
                    pluginInstance.allGlobalAccesses.add(access);
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
        for (const [filePath, apiNames] of this.fileAccesses) {
          files.push({
            file: filePath,
            apiNames: [...apiNames]
          });
        }
        
        const dataToSave = {
          files: files,
          aggregated: [...this.allGlobalAccesses]
        };
        
        console.log(JSON.stringify(dataToSave, null, 2));
        
        callback();
      }
    );
  }
}

export default WebpackGlobalAccessCollectorPlugin;