import { writeFile } from 'fs';

class WebpackGlobalAccessCollectorPlugin {

  constructor() {
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
                  console.log(`${loaderContext.resourcePath}:`);
                }
                metadata.currentFileAccesses.forEach(access => {
                  console.log(`  ${access}`);
                  pluginInstance.allGlobalAccesses.add(access);
                });
              }
            };
          }
        );
      });

    compiler.hooks.afterEmit.tapAsync(
      'WebpackGlobalAccessCollectorPlugin',
      (compilation, callback) => {
        const outputFilePath = compilation.outputOptions.path + '/global-accesses.json';
        const dataToSave = [...this.allGlobalAccesses];
        writeFile(outputFilePath, JSON.stringify(dataToSave, null, 2), (err) => {
          if (err) {
            console.error('Error writing global access data:', err);
            return callback(err);
          }
          console.log(`Global access data saved to ${outputFilePath}`);
          callback();
        });
      }
    );
  }
}

export default WebpackGlobalAccessCollectorPlugin;