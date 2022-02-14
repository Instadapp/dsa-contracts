import abis from "./constant/abis";
import addresses from "./constant/addresses";
import hre from "hardhat";
const { web3 } = hre;

export default function (spells: any[]) {
  const targets = spells.map((a: { connector: any }) => a.connector);
  const calldatas = spells.map(
    (a: { method: any; connector: string | number; args: any }) => {
      const functionName = a.method;
      const abi = abis.connectors[a.connector].find((b: { name: any }) => {
        return b.name === functionName;
      });
      if (!abi) throw new Error("Couldn't find function");
      return web3.eth.abi.encodeFunctionCall(abi, a.args);
    }
  );
  return [targets, calldatas];
}
