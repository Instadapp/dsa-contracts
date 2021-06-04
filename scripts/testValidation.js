const hre = require('hardhat')
const axios = require('axios')
const { execute } = require('@getvim/execute')

const { ethers, artifacts } = hre
const fs = require('fs/promises')
const path = require('path')
const {
  assertUpgradeSafe,
  Manifest,
  getImplementationAddress,
  ValidationOptions,
  getCode,
  extractStorageLayout,
  // TODO: remove above imports?
  assertStorageUpgradeSafe,
  getStorageLayout,
  getVersion,
  getUnlinkedBytecode,
  getStorageLayoutForAddress,
  isCurrentValidationData,
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

async function createParentDir (path) {
  path = path.split('/').slice(0, -1)
  for (let index = 0; index < path.length; index++) {
    const dir = path.slice(0, index + 1).join('/')
    try {
      await fs.access(dir)
    } catch (e) {
      await fs.mkdir(dir)
    }
  }
}

async function checkForRemoteMultipleImplementationStorage ({ address, localName }) {
  try {
    const code = await getEtherscanSourceCode(address)
    let codeUpd = code.split('\r\n')
    const sourseStart = codeUpd.findIndex(s => s.includes('"sources":'))
    const sourseEnd = codeUpd.findIndex((s, i) => s.startsWith(`${codeUpd[sourseStart].split('"')[0]}},`))
    codeUpd = codeUpd.slice(sourseStart, sourseEnd)
    const contracts = []
    let contractObj = {}
    for (let index = 0; index < codeUpd.length; index++) {
      const str = codeUpd[index]
      if (str.includes('contracts')) {
        contractObj.path = str.split('"')[1]
      } else if (str.includes('content": "')) {
        contractObj.code = str
          .split('content": "')[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
        if (contractObj.code.endsWith('"')) contractObj.code = contractObj.code.slice(0, -1)
        contracts.push(contractObj)
        contractObj = {}
      }
    }
    for (let index = 0; index < contracts.length; index++) {
      const contract = contracts[index]
      await createParentDir(`contracts/test/${contract.path}`)
      await fs.writeFile(`contracts/test/${contract.path}`, contract.code)
    }
    await execute('npx hardhat compile')
    const { implName } = await findImplByCode(code)
    const validations = await readValidations(hre)
    const t = { context: {} }
    const buildInfo = await artifacts.getBuildInfo(`${contracts[0].path}:${implName}`)
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
  return findImplByCode(code)
}

async function findImplByCode (code) {
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
