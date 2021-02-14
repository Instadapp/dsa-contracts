// Buidler
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3")
require("hardhat-deploy");
require("hardhat-deploy-ethers");

require('@openzeppelin/hardhat-upgrades');
require("@tenderly/hardhat-tenderly");

require("hardhat-gas-reporter");
require("solidity-coverage");

require("dotenv").config();
// const INFURA_ID = process.env.INFURA_ID;
// assert.ok(INFURA_ID, "no Infura ID in process.env");
const ALCHEMY_ID = process.env.ALCHEMY_ID;
// assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

const INSTA_MASTER = "0xb1DC62EC38E6E3857a887210C38418E4A17Da5B2";

const INSTA_INDEX = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";

// ================================= CONFIG =========================================
module.exports = {
  defaultNetwork: "hardhat",
  tenderly: {
    project: "team-development",
    username: "InstaDApp",
    forkNetwork: "1"
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        blockNumber: 11739260,
      },
      blockGasLimit: 12000000,

      masterAddress: INSTA_MASTER,
      instaIndexAddress: INSTA_INDEX
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.0",
        settings: {
          optimizer: { enabled: false },
        },
      },
      {
        version: "0.6.8",
        settings: {
          optimizer: { enabled: false },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: { enabled: false },
        },
      }
    ]
  },

};

