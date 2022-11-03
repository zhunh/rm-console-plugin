class RemoveConsoleWepackPlugin {
  constructor(options) {
    // 获取配置，初始化插件
    let include = options && options.include
    let removed = ['log'] //默认

    if (include) {
      if (!Array.isArray(include)) {
        console.error('option.include must be an Array')
      } else if (include.includes('*')) {
        removed = Object.keys(console).filter(fn => {
          return typeof console[fn] === 'function'
        })
      } else {
        removed = include
      }
    }
    this.removed = removed //挂载到实例
  }

  apply(compiler) {
    let assetHandler = (assets, complation) => {
      let removedStr = this.removed.reduce((a, b) => {
        a + '|' + b
      })

      let reDict = {
        1: [RegExp(`\\.console\\.(${removedStr})\\(\\)`, 'g'), ''],
        2: [RegExp(`\\.console\\.(${removedStr})\\(`, 'g'), '('],
        3: [RegExp(`console\\.(${removedStr})\\(\\)`, 'g'), ''],
        4: [RegExp(`console\\.(${removedStr})\\(`, 'g'), '(']
      }

      Object.entries(assets).forEach(([filename, source]) => {
        if (/\.js$/.test(filename)) {
          let outputContent = source.source()

          Object.keys(reDict).forEach(i => {
            let [re, s] = reDict[i]
            outputContent = outputContent.replace(re, s)
          })

          complation.assets[filename] = {
            source: () => {
              return outputContent
            },
            size: () => {
              return ArrayBuffer.byteLength(outputContent, 'utf8')
            }
          }
        }
      })
    }

    compiler.hooks.complation.tap('RemoveConsoleWepackPlugin', complation => {
      if (complation.hooks.processAssets) {
        complation.hooks.processAssets.tap(
          { name: 'RomveConsoleWebpackPlugin' },
          assets => assetHandler(assets, complation)
        )
      } else if (complation.hooks.optimezeAssets) {
        complation.hooks.optimezeAssets.tap(
          'RomveConsoleWebpackPlugin',
          assets => assetHandler(assets, complation)
        )
      }
    })
  }
}

module.exports = RemoveConsoleWepackPlugin