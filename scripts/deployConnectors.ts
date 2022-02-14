import hre from "hardhat";
import deployConnector from "./deployConnector";

export default async function (connectors: any[]) {
  const instances = await Promise.all(
    connectors.map(async (connector) => {
      const instance = await deployConnector({
        connectorName: connector.connectorName,
        contract: connector.contract,
        factory: connector.abi,
      });
      return instance;
    })
  );

  return instances;
}
