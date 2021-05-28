const hre = require('hardhat')
const axios = require('axios')

const { ethers, artifacts, deployments } = hre
const fs = require('fs/promises')
const path = require('path')
const test = require('@openzeppelin/upgrades-core')
const {
  assertUpgradeSafe,
  assertStorageUpgradeSafe,
  getStorageLayout,
  getVersion,
  getUnlinkedBytecode,
  Manifest,
  getImplementationAddress,
  ValidationOptions,
  getStorageLayoutForAddress, // TODO: How to use this?
  isCurrentValidationData,
  getCode,
  extractStorageLayout // TODO: How to use this?
} = require('@openzeppelin/upgrades-core')

async function main () {
  try {
    const address = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021'
    await checkForLocalMultipleImplementationStorage([
      'InstaImplementationM1',
      'InstaImplementationM2'
    ])
    const addressImpl = await findImplByAddress(address)
    await checkForLocalMultipleImplementationStorage([
      addressImpl,
      'InstaImplementationM2'
    ])
    // HOW TO MAKE THIS WORK?
    // const { provider } = hre.network
    // const manifest = await Manifest.forNetwork(provider)
    // const validations = await readValidations(hre)
    // // let ImplFactory2 = await getCode(provider, "0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021")
    // const deploymentLayout = await getStorageLayoutForAddress(manifest, validations, address)
    // // // console.log("main -> Impl", ImplFactory2)
    // // ImplFactory2 = {bytecode: ImplFactory2}
    // // // const ImplFactory = await ethers.getContractFactory('InstaImplementationM1') // need name?
    // // // const ImplFactory2 = await ethers.getContractFactory('InstaDefaultImplementationV2') // need name?
    // // // console.log("main -> ImplFactory", ImplFactory)
    // // // const proxyAddress = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021' // contract addr
    // // // const unlinkedBytecode = getUnlinkedBytecode(validations, ImplFactory.bytecode)
    // // const unlinkedBytecode2 = getUnlinkedBytecode(validations, ImplFactory2.bytecode)
    // // // console.log("main -> unlinkedBytecode2", unlinkedBytecode2)
    // // // const version = getVersion(unlinkedBytecode, ImplFactory.bytecode)
    // // const version2 = getVersion(unlinkedBytecode2, ImplFactory2.bytecode)
    // // console.log("main -> version2", version2)
    // // const opts = ValidationOptions // not clear
    // // assertUpgradeSafe(validations, version, opts)
    // // const currentImplAddress = await getImplementationAddress(provider, proxyAddress)
    // console.log("main -> deploymentLayout", deploymentLayout)
    // // const layout = getStorageLayout(validations, version)
    // const layout2 = getStorageLayout(validations, version2)
    // // assertStorageUpgradeSafe(layout2, layout, false)
    console.log('main passed')
  } catch (error) {
    console.log('not passed', error)
  }
}

async function checkForLocalMultipleImplementationStorage (implArr) {
  try {
    const validations = await readValidations(hre)
    implArr = implArr.map(val => ({ name: val }))
    for (let index = 0; index < implArr.length; index++) {
      const impl = implArr[index]
      impl.factory = await ethers.getContractFactory(impl.name)
      impl.unlinkedBytecode = getUnlinkedBytecode(validations, impl.factory.bytecode)
      impl.version = getVersion(impl.unlinkedBytecode, impl.factory.bytecode)
      impl.layout = getStorageLayout(validations, impl.version)
    }
    assertStorageUpgradeSafe(implArr[0].layout, implArr[1].layout, false)
    console.log('passed')
  } catch (error) {
    console.log('not passed', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
class ValidationsCacheNotFound extends Error {
  constructor () {
    super('Validations cache not found. Recompile with `hardhat compile --force`')
  }
}

class ValidationsCacheOutdated extends Error {
  constructor () {
    super('Validations cache is outdated. Recompile with `hardhat compile --force`')
  }
}

function getValidationsCachePath (hre) {
  return path.join(hre.config.paths.cache, 'validations.json')
}

async function readValidations (hre) {
  const cachePath = getValidationsCachePath(hre)
  try {
    const data = JSON.parse(await fs.readFile(cachePath, 'utf8'))
    if (!isCurrentValidationData(data)) {
      await fs.unlink(cachePath)
      throw new ValidationsCacheOutdated()
    }
    return data
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new ValidationsCacheNotFound()
    } else {
      throw e
    }
  }
}

async function getEtherscanSourceCode (address) {
  try {
    const responce = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address,
        apikey: process.env.ETHERSCAN
      }
    })
    return responce.data.result[0].SourceCode
  } catch (error) {
    Promise.reject(error)
  }
}

async function findImplByAddress (address) {
  const code = await getEtherscanSourceCode(address)
  const path = code.split('contracts')[1].split('"')[0]
  const contractCode = await fs.readFile(`./contracts${path}`, { encoding: 'utf8' })
  const implName = contractCode
    .slice(contractCode.lastIndexOf('contract ') + 9)
    .split(' ')[0]
  return implName
}
