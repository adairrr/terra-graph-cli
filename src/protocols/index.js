const immutable = require('immutable')

const CosmosTemplateCodeGen = require('./cosmos/codegen/template')
const CosmosTypeGenerator = require('./cosmos/type-generator')
const CosmosSubgraph = require('./cosmos/subgraph')

const EthereumABI = require('./ethereum/abi')
const EthereumTemplateCodeGen = require('./ethereum/codegen/template')
const EthereumTypeGenerator = require('./ethereum/type-generator')
const EthereumSubgraph = require('./ethereum/subgraph')

const NearSubgraph = require('./near/subgraph')
module.exports = class Protocol {
  static fromDataSources(dataSourcesAndTemplates) {
    const firstDataSourceKind = dataSourcesAndTemplates[0].kind
    return new Protocol(firstDataSourceKind)
  }
  constructor(name) {
    this.name = this.normalizeName(name)
  }
  availableProtocols() {
    return immutable.fromJS({
      // `ethereum/contract` is kept for backwards compatibility.
      // New networks (or protocol perhaps) shouldn't have the `/contract` anymore (unless a new case makes use of it).
      ethereum: ['ethereum', 'ethereum/contract'],
      near: ['near'],
      tendermint: ['tendermint/data'],
    })
  }
  normalizeName(name) {
    return this.availableProtocols()
      .findKey(possibleNames => possibleNames.includes(name))
  }
  // Receives a data source kind, and checks if it's valid
  // for the given protocol instance (this).
  isValidKindName(kind) {
    return this.availableProtocols()
      .get(this.name, immutable.List())
      .includes(kind)
  }
  hasABIs() {
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return true
      case 'near/data':
        return false
      case 'tendermint/data':
        return false
    }
  }
  getTypeGenerator(options) {
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return new EthereumTypeGenerator(options)
      case 'near':
        return null
      case 'tendermint':
        return new CosmosTypeGenerator(options)
    }
  }
  getTemplateCodeGen(template) {
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return new EthereumTemplateCodeGen(template)
      case 'tendermint':
        return new CosmosTemplateCodeGen(template)
      default:
        throw new Error(
          `Data sources with kind '${this.name}' are not supported yet`,
        )
    }
  }
  getABI() {
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return EthereumABI
      case 'near':
        return null
      case 'tendermint':
        return null
    }
  }
  getSubgraph(options = {}) {
    const optionsWithProtocol = { ...options, protocol: this }
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return new EthereumSubgraph(optionsWithProtocol)
      case 'near':
        return new NearSubgraph(optionsWithProtocol)
      case 'tendermint':
        return new CosmosSubgraph(optionsWithProtocol)
      default:
        throw new Error(
          `Data sources with kind '${this.name}' are not supported yet`,
        )
    }
  }
}
