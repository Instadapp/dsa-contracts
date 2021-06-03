const hre = require('hardhat')
const axios = require('axios')

const { ethers, artifacts, deployments } = hre
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
  solcInputOutputDecoder,
  validate
} = require('@openzeppelin/upgrades-core')
const { normalizeValidationData } = require('@openzeppelin/upgrades-core/dist/validate/data.js')

async function main () {
  try {
    const address = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021'
    await checkForLocalMultipleImplementationStorage([
      'InstaImplementationM1',
      'InstaImplementationM2'
    ])
    const { implName } = await findImplByAddress(address)
    await checkForLocalMultipleImplementationStorage([
      implName,
      'InstaImplementationM2'
    ])
    await checkForRemoteMultipleImplementationStorage({
      address,
      localName: 'InstaImplementationM2'
    })
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

async function checkForRemoteMultipleImplementationStorage ({ address, localName }) {
  try {
    const { implName, implPath } = await findImplByAddress(address)
    const validations = await readValidations(hre)
    const t = { context: {} }
    const buildInfo = await artifacts.getBuildInfo(`${implPath}:${implName}`)
    const decodeSrc = solcInputOutputDecoder(buildInfo.input, buildInfo.output)
    t.context.validationRun = validate(buildInfo.output, decodeSrc)
    t.context.validationData = normalizeValidationData([t.context.validationRun])
    const { version } = t.context.validationRun[implName]
    const updatedLayout = getStorageLayout(t.context.validationData, version)
    const outdatedLayout = removeStorageLayoutMembers(updatedLayout)
    const manifest = mockManifest({
      manifestVersion: '3.1',
      impls: {
        [version.withoutMetadata]: {
          address,
          txHash: '0x6580b51f3edcacacf30d7b4140e4022b65d2a5ba7cbe7e4d91397f4c3b5e8a6b',
          layout: outdatedLayout
        }
      }
    })
    const deploymentLayout = await getStorageLayoutForAddress(manifest, validations, address)
    const localFactory = await ethers.getContractFactory(localName)
    const localUnlinkedBytecode = getUnlinkedBytecode(validations, localFactory.bytecode)
    const localversion = getVersion(localUnlinkedBytecode, localFactory.bytecode)
    const localLayout = getStorageLayout(validations, localversion)
    assertStorageUpgradeSafe(deploymentLayout, localLayout, false)
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
  const implPath = `contracts${code.split('contracts')[1].split('"')[0]}`
  const contractCode = await fs.readFile(implPath, { encoding: 'utf8' })
  const implName = contractCode
    .slice(contractCode.lastIndexOf('contract ') + 9)
    .split(' ')[0]
  return { implName, implPath }
}

function mockManifest (data) {
  const Manifest = {
    data,
    async read () {
      return this.data
    },
    async write (data) {
      this.data = data
    },
    async lockedRun (cb) {
      return cb()
    }
  }
  return Manifest
}

// Simulate a layout from a version without struct/enum members
function removeStorageLayoutMembers (layout) {
  const res = { ...layout, types: { ...layout.types } }
  for (const id in res.types) {
    res.types[id] = { ...layout.types[id], members: undefined }
  }
  return res
}
