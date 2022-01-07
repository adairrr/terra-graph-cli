const immutable = require('immutable')

const TendermintSubgraph = require('./tendermint/subgraph')

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
      tendermint: ['tendermint'],
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
      case 'tendermint':
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
        return null
    }
  }
  getTemplateCodeGen(template) {
    switch (this.name) {
      case 'ethereum':
      case 'ethereum/contract':
        return new EthereumTemplateCodeGen(template)
      case 'tendermint':
        return null
      default:
        throw new Error(
          `Data sources with kind '${JSON.stringify(this)}' '${this.name}' are not supported yet`,
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
        return new TendermintSubgraph(optionsWithProtocol)
      default:
        throw new Error(
          `Data sources with kind '${this.name}' for subgraph are not supported yet`,
        )
    }
  }
}
