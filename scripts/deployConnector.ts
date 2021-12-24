import abis from "./constant/abis";
import addresses from "./constant/addresses";

import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

export default async function ({ connectorName, contract, abi }) {
  const ConnectorInstance = await ethers.getContractFactory(contract);
  const connectorInstance = await ConnectorInstance.deploy();
  await connectorInstance.deployed();

  addresses.connectors[connectorName] = connectorInstance.address;
  abis.connectors[connectorName] = abi;

  return connectorInstance;
}
