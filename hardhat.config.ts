// // Buidler
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-etherscan";
import "@tenderly/hardhat-tenderly";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { utils } from "ethers";
import Web3 from "web3";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  hardhat: 31337,
  mainnet: 1,
  avalanche: 43114,
  polygon: 137,
  arbitrum: 42161,
};

const ALCHEMY_ID = process.env.ALCHEMY_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API = process.env.ETHERSCAN_API_KEY;
const POLYGONSCAN_API = process.env.POLYGON_API_KEY;
const ARBISCAN_API = process.env.ARBISCAN_API_KEY;
const SNOWTRACE_API = process.env.SNOWTRACE_API_KEY;
const mnemonic =
  process.env.MNEMONIC ??
  "test test test test test test test test test test test junk";

function createConfig(network: string) {
  return {
    url: getNetworkUrl(network),
    accounts: !!PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : { mnemonic },
    timeout: 150000,
  };
}

function getNetworkUrl(networkType: string) {
  if (networkType === "avalanche")
    return "https://api.avax.network/ext/bc/C/rpc";
  else if (networkType === "polygon")
    return `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`;
  else if (networkType === "arbitrum")
    return `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`;
  else if (networkType === "kovan")
    return `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`;
  else return `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`;
}
const INSTA_MASTER = "0xb1DC62EC38E6E3857a887210C38418E4A17Da5B2";

// ================================= CONFIG =========================================
const config = {
  defaultNetwork: "hardhat",
  gasReporter: {
    enabled: true,
    currency: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  tenderly: {
    project: "team-development",
    username: "InstaDApp",
    forkNetwork: "1",
  },
  networks: {
    hardhat: {
      forking: {
        url: String(getNetworkUrl(String(process.env.networkType))),
        // blockNumber: 11739260,`
        blockNumber: 15010000,
      },
      blockGasLimit: 12000000,
      masterAddress: INSTA_MASTER,
    },
    kovan: createConfig("kovan"),
    mainnet: createConfig("mainnet"),
    matic: createConfig("polygon"),
    avax: createConfig("avalanche"),
    arbitrum: createConfig("arbitrum"),
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
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 10000 * 1000, // 10,000 seconds
  },
};
export default config;
