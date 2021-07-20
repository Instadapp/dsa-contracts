const { ethers, artifacts } = require('hardhat')

const {
  assertStorageUpgradeSafe,
  getStorageLayout,
  getVersion,
  getUnlinkedBytecode,
  getStorageLayoutForAddress,
  isCurrentValidationData,
  solcInputOutputDecoder,
  validate
} = require('@openzeppelin/upgrades-core')

async function main () {
  try {
    const InstaImplementationM1Address = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021'

    /* Create a check for asserting local implementations with each other */
    // await checkForLocalMultipleImplementationStorage([ 
    //   'contracts/v2/accounts/default/implementation_default.sol',
    //   'contracts/v2/accounts/module1/Implementation_m1.sol'
    // ])

    /* Create a check for asserting local implementation with on-chain implementation */
    //  await checkForLocalImplementationStorageWithOnChainImplementation([
    //     InstaImplementationM1Address,
    //     'InstaImplementationM1'
    //   ])

    console.log('main passed')
  } catch (error) {
    console.error('not passed', error)
  }
}
