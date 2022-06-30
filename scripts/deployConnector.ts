import abis from "./constant/abis";
import addresses from "./constant/addresses";

import hre from "hardhat";
const { ethers } = hre;

export default async function ({ connectorName, contract, factory }, args?) {
  const ConnectorInstance = <typeof factory>(
    await ethers.getContractFactory(contract)
  );
  const connectorInstance = await ConnectorInstance.deploy(...args);
  await connectorInstance.deployed();

  console.log(`${connectorName} Deployed: ${connectorInstance.address}`);

  addresses.connectors[connectorName] = connectorInstance.address;
  abis.connectors[connectorName] = factory.abi;

  return connectorInstance;
}
