const abis = require("./constant/abis");
const addresses = require("./constant/addresses");
const { web3 } = hre;

module.exports = function (spells) {
 const targets = spells.map(a => a.connector)
 const calldatas = spells.map(a => {
    const functionName = a.method;
    // console.log(functionName)
    const abi = abis.connectors[a.connector].find(b => {
        return b.name === functionName
    });
    // console.log(functionName)
    if (!abi) throw new Error("Couldn't find function")
    return web3.eth.abi.encodeFunctionCall(abi, a.args)
 })
 return [targets, calldatas]
};
