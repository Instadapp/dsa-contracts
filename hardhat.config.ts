// Buidler
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@tenderly/hardhat-tenderly";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { utils } from "ethers";
import Web3 from "web3";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// const INFURA_ID = process.env.INFURA_ID;
// assert.ok(INFURA_ID, "no Infura ID in process.env");
const ALCHEMY_ID = process.env.ALCHEMY_ID;

// assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  mainnet: 1,
  avalanche: 43114,
  polygon: 137,
  arbitrum: 42161,
};

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API = process.env.ETHERSCAN_API_KEY;
const POLYGONSCAN_API = process.env.POLYGON_API_KEY;
const ARBISCAN_API = process.env.ARBISCAN_API_KEY;
const SNOWTRACE_API = process.env.SNOWTRACE_API_KEY;
const mnemonic =
  process.env.MNEMONIC ??
  "test test test test test test test test test test test junk";

const INSTA_MASTER = "0xb1DC62EC38E6E3857a887210C38418E4A17Da5B2";

const INSTA_INDEX = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";

// ================================= CONFIG =========================================
module.exports = {
  defaultNetwork: "hardhat",
  tenderly: {
    project: "team-development",
    username: "InstaDApp",
    forkNetwork: "1",
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        // blockNumber: 11739260,
        blockNumber: 12068005,
      },
      blockGasLimit: 12000000,

      masterAddress: INSTA_MASTER,
      instaIndexAddress: INSTA_INDEX,
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://eth.alchemyapi.io/v2/${ALCHEMY_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 150000,
      // gasPrice: parseInt(utils.parseUnits("160", "gwei")),
    },
    matic: {
      // url: `https://eth.alchemyapi.io/v2/${ALCHEMY_ID}`,
      url: "https://rpc-mainnet.maticvigil.com/",
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 150000,
      // gasPrice: parseInt(utils.parseUnits("1", "gwei")),
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
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN,
  },
};
