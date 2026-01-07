import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";
import { configVariable } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";


import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers, hardhatVerify],
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    mainnet: {
      type: "http",
      chainType: "l1",
      url: "https://eth-mainnet.public.blastapi.io",
      accounts: [configVariable("PRIVATE_KEY")],
    },
    bscMainnet: {
      type: "http",
      chainType: "l1",
      url: "https://binance.llamarpc.com",
      accounts: [configVariable("PRIVATE_KEY")],
      gas: 10_000_000,
    },
    simulation: {
      type: "http",
      url: process.env.TENDERLY_RPC_URL || `https://virtual.mainnet.rpc.tenderly.co/${process.env.SIMULATION_ID}`,
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
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_V2_KEY || "",
    },
  }
};

export default config;