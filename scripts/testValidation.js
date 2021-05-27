const hre = require('hardhat')
const { ethers } = hre
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
  getStorageLayoutForAddress,
  isCurrentValidationData
} = require('@openzeppelin/upgrades-core')

async function main () {
  try {
    const { provider } = hre.network
    const manifest = await Manifest.forNetwork(provider)
    const validations = await readValidations(hre)
    const ImplFactory = await ethers.getContractFactory('InstaImplementationM1') // need name?
    const proxyAddress = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021' // contract addr
    const unlinkedBytecode = getUnlinkedBytecode(validations, ImplFactory.bytecode)
    const version = getVersion(unlinkedBytecode, ImplFactory.bytecode)
    const opts = ValidationOptions // not clear
    assertUpgradeSafe(validations, version, opts)
    const currentImplAddress = await getImplementationAddress(provider, proxyAddress)
    const deploymentLayout = await getStorageLayoutForAddress(manifest, validations, currentImplAddress)
    const layout = getStorageLayout(validations, version)
    assertStorageUpgradeSafe(deploymentLayout, layout, opts.unsafeAllowCustomTypes)
    console.log('passed')
  } catch (error) {
    console.log('not passed', error)
  }
}

main()

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
