const hre = require('hardhat')
const { ethers, deployments } = hre
const fs = require('fs/promises')
const path = require('path')
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
  extractStorageLayout, // TODO: How to use this?
} = require('@openzeppelin/upgrades-core')

async function main () {
  try {
    await checkForLocalMultipleImplementationStorage()
    // HOW TO MAKE THIS WORK?
    const { provider } = hre.network
    const manifest = await Manifest.forNetwork(provider)
    const validations = await readValidations(hre)
    const deploymentLayout = await getStorageLayoutForAddress(manifest, validations, "0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021")
    // // let ImplFactory2 = await getCode(provider, "0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021")
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
    // console.log('passed')
  } catch (error) {
    console.log('not passed', error)
  }
}

async function checkForLocalMultipleImplementationStorage() {
  try {
    const validations = await readValidations(hre)
    const InstaImplementationM1 = await ethers.getContractFactory('InstaImplementationM1')
    const InstaImplementationM2 = await ethers.getContractFactory('InstaImplementationM2')
    const unlinkedBytecodeM1 = getUnlinkedBytecode(validations, InstaImplementationM1.bytecode)
    const unlinkedBytecode2M2 = getUnlinkedBytecode(validations, InstaImplementationM2.bytecode)
    const versionM1 = getVersion(unlinkedBytecodeM1, InstaImplementationM1.bytecode)
    const versionM2 = getVersion(unlinkedBytecode2M2, InstaImplementationM2.bytecode)
    const layoutM1 = getStorageLayout(validations, versionM1)
    const layoutM2 = getStorageLayout(validations, versionM2)
    assertStorageUpgradeSafe(layoutM1, layoutM2, false)
    console.log('passed')
  } catch (error) {
    console.log('not passed', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
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
