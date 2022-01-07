const immutable = require('immutable')

const TendermintSubgraph = require('./tendermint/subgraph')

const EthereumABI = require('./ethereum/abi')
const EthereumTemplateCodeGen = require('./ethereum/codegen/template')
const EthereumTypeGenerator = require('./ethereum/type-generator')
const EthereumSubgraph = require('./ethereum/subgraph')
const NearSubgraph = require('./near/subgraph')
const EthereumContract = require('./ethereum/contract')
const NearContract = require('./near/contract')
const EthereumManifestScaffold = require('./ethereum/scaffold/manifest')
const NearManifestScaffold = require('./near/scaffold/manifest')
const EthereumMappingScaffold = require('./ethereum/scaffold/mapping')
const NearMappingScaffold = require('./near/scaffold/mapping')

const NearSubgraph = require('./near/subgraph')
module.exports = class Protocol {
  static fromDataSources(dataSourcesAndTemplates) {
    const firstDataSourceKind = dataSourcesAndTemplates[0].kind
    return new Protocol(firstDataSourceKind)
  }
  constructor(name) {
    this.name = this.normalizeName(name)
  }

  static availableProtocols() {
    return immutable.fromJS({
      // `ethereum/contract` is kept for backwards compatibility.
      // New networks (or protocol perhaps) shouldn't have the `/contract` anymore (unless a new case makes use of it).
      ethereum: ['ethereum', 'ethereum/contract'],
      near: ['near'],
      tendermint: ['tendermint'],
    })
  }

  static availableNetworks() {
    return immutable.fromJS({
      ethereum: [
        'mainnet',
        'kovan',
        'rinkeby',
        'ropsten',
        'goerli',
        'poa-core',
        'poa-sokol',
        'xdai',
        'matic',
        'mumbai',
        'fantom',
        'bsc',
        'chapel',
        'clover',
        'avalanche',
        'fuji',
        'celo',
        'celo-alfajores',
        'fuse',
        'mbase',
        'arbitrum-one',
        'arbitrum-rinkeby',
        'optimism',
        'optimism-kovan',
        'aurora',
        'aurora-testnet',
      ],
      near: ['near-mainnet'],
      tendermint: ['cosmoshub-3', 'cosmoshub-4']
    })
  }

  normalizeName(name) {
    return Protocol.availableProtocols().findKey(possibleNames =>
      possibleNames.includes(name),
    )
  }

  displayName() {
    switch (this.name) {
      case 'ethereum':
        return 'Ethereum'
      case 'near':
        return 'NEAR'
      case 'tendermint':
        return 'Tendermint'
    }
  }
  // Receives a data source kind, and checks if it's valid
  // for the given protocol instance (this).
  isValidKindName(kind) {
    return Protocol.availableProtocols()
      .get(this.name, immutable.List())
      .includes(kind)
  }
  hasABIs() {
    switch (this.name) {
      case 'ethereum':
        return true
      case 'near':
        return false
    }
  }

  hasEvents() {
    switch (this.name) {
      case 'ethereum':
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
        return new EthereumSubgraph(optionsWithProtocol)
      case 'near':
        return new NearSubgraph(optionsWithProtocol)
      case 'tendermint':
        return new TendermintSubgraph(optionsWithProtocol)
      default:
        throw new Error(`Data sources with kind '${this.name}' are not supported yet`)
    }
  }

  getContract() {
    switch (this.name) {
      case 'ethereum':
        return EthereumContract
      case 'near':
        return NearContract
    }
  }

  getManifestScaffold() {
    switch (this.name) {
      case 'ethereum':
        return EthereumManifestScaffold
      case 'near':
        return NearManifestScaffold
    }
  }

  getMappingScaffold() {
    switch (this.name) {
      case 'ethereum':
        return EthereumMappingScaffold
      case 'near':
        return NearMappingScaffold
    }
  }
}
