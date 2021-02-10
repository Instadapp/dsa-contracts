const abis = require("./constant/abis");
const addresses = require("./constant/addresses");

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs")
const deployConnector = require("./deployConnector")


module.exports = async function (connectors) {
  const instances = await Promise.all(connectors.map(async (connector) => {
    const instance = await deployConnector({
      connectorName: connector.connectorName,
      contract: connector.contract,
      abi: connector.abi
    })
    return instance
  }))

  return instances
};
