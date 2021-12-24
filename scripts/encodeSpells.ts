const abis = require("./constant/abis");
const addresses = require("./constant/addresses");
const { web3 } = hre;

export default function (spells) {
  const targets = spells.map((a) => a.connector);
  const calldatas = spells.map((a) => {
    const functionName = a.method;
    const abi = abis.connectors[a.connector].find((b) => {
      return b.name === functionName;
    });
    if (!abi) throw new Error("Couldn't find function");
    return web3.eth.abi.encodeFunctionCall(abi, a.args);
  });
  return [targets, calldatas];
}
