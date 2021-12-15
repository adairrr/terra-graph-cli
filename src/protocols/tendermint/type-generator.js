const fs = require('fs-extra')
const path = require('path')
const immutable = require('immutable')
const prettier = require('prettier')
const ABI = require('./abi')
const { step, withSpinner } = require('../../command-helpers/spinner')
const { GENERATED_FILE_NOTE } = require('../../codegen/typescript')
const { displayPath } = require('../../command-helpers/fs')

module.exports = class TendermintTypeGenerator {
  constructor(options = {}) {
    this.sourceDir = options.sourceDir
    this.outputDir = options.outputDir
  }

  async loadABIs(subgraph) {
    return await withSpinner(
      'Load contract ABIs',
      'Failed to load contract ABIs',
      `Warnings while loading contract ABIs`,
      async spinner => {
        try {
          return subgraph
            .get('dataSources')
            .reduce(
              (abis, dataSource) =>
              dataSource
              .getIn(['mapping', 'abis'])
              .reduce(
                (abis, abi) =>
                abis.push(
                  this._loadABI(
                    dataSource,
                    abi.get('name'),
                    abi.get('file'),
                    spinner,
                  ),
                ),
                abis,
              ),
              immutable.List(),
            )
        } catch (e) {
          throw Error(`Failed to load contract ABIs: ${e.message}`)
        }
      },
    )
  }

  async _loadDataSourceTemplateABI(template, name, maybeRelativePath, spinner) {
    try {
      if (this.sourceDir) {
        let absolutePath = path.resolve(this.sourceDir, maybeRelativePath)
        step(
          spinner,
          `Load data source template ABI from`,
          displayPath(absolutePath),
        )
        return { template, abi: ABI.load(name, absolutePath) }
      } else {
        return { template, abi: ABI.load(name, maybeRelativePath) }
      }
    } catch (e) {
      throw Error(`Failed to load data source template ABI: ${e.message}`)
    }
  }

  async  _generateTypesForABI(abi, spinner) {
    try {
      step(
        spinner,
        `Generate types for contract ABI:`,
        `${abi.abi.name} (${displayPath(abi.abi.file)})`,
      )

      let codeGenerator = abi.abi.codeGenerator()
      let code = prettier.format(
        [
          GENERATED_FILE_NOTE,
          ...codeGenerator.generateModuleImports(),
          ...codeGenerator.generateTypes(),
        ].join('\n'),
        {
          parser: 'typescript',
        },
      )

      let outputFile = path.join(
        this.outputDir,
        abi.dataSource.get('name'),
        `${abi.abi.name}.ts`,
      )
      step(spinner, `Write types to`, displayPath(outputFile))
      await fs.mkdirs(path.dirname(outputFile))
      await fs.writeFile(outputFile, code)
    } catch (e) {
      throw Error(`Failed to generate types for contract ABI: ${e.message}`)
    }
  }

  async generateTypesForDataSourceTemplateABIs(abis) {
    return await withSpinner(
      `Generate types for data source template ABIs`,
      `Failed to generate types for data source template ABIs`,
      `Warnings while generating types for data source template ABIs`,
      async spinner => {
        return await Promise.all(
          abis.map(
            async (abi, name) =>
              await this._generateTypesForDataSourceTemplateABI(abi, spinner),
          ),
        )
      },
    )
  }

  async _generateTypesForDataSourceTemplateABI(abi, spinner) {
    try {
      step(
        spinner,
        `Generate types for data source template ABI:`,
        `${abi.template.get('name')} > ${abi.abi.name} (${displayPath(
          abi.abi.file,
        )})`,
      )

      let codeGenerator = abi.abi.codeGenerator()
      let code = prettier.format(
        [
          GENERATED_FILE_NOTE,
          ...codeGenerator.generateModuleImports(),
          ...codeGenerator.generateTypes(),
        ].join('\n'),
        {
          parser: 'typescript',
        },
      )

      let outputFile = path.join(
        this.outputDir,
        'templates',
        abi.template.get('name'),
        `${abi.abi.name}.ts`,
      )
      step(spinner, `Write types to`, displayPath(outputFile))
      await fs.mkdirs(path.dirname(outputFile))
      await fs.writeFile(outputFile, code)
    } catch (e) {
      throw Error(`Failed to generate types for data source template ABI: ${e.message}`)
    }
  }
}
