import deployConnector, { deployConnectorArgs } from "./deployConnector";

export default async function deployConnectors(
  connectors: deployConnectorArgs[]
) {
  const instances = await Promise.all(
    connectors.map(async (connector) => {
      const instance = await deployConnector({
        connectorName: connector.connectorName,
        contract: connector.contract,
        abi: connector.abi,
      });
      return instance;
    })
  );

  return instances;
}
