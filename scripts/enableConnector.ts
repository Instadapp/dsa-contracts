import abis from "./constant/abis";
import addresses from "./constant/addresses";

export default function ({ connectorName, address, abi }) {
  addresses.connectors[connectorName] = address;
  abis.connectors[connectorName] = abi;

  return { addresses, abis };
}
