
const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer) {
    await changeBasicConnectMemoryVarAddr()
};

// change mvar variable in basic.sol connector.
async function changeBasicConnectMemoryVarAddr() { 
    var memoryInstance = await artifacts.require("InstaMemory").deployed(); //memoryVar.sol contract instance
    var eventInstance = await artifacts.require("InstaEvent").deployed(); //memoryVar.sol contract instance
    console.log("\nInstaMemory Address:", memoryInstance.address)
    console.log("InstaEventAddress:", eventInstance.address, "\n")

    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/basic.sol');
    const options = 
        {
            files: filePath,
            from: [/return (.*); \/\/ InstaMemory Address/, /return (.*); \/\/ InstaEvent Address/],
            to: [`return ${memoryInstance.address}; // InstaMemory Address`, `return ${eventInstance.address}; // InstaEvent Address`],
        }
    
    
    //replace the memory and event address in the basic connector contract.
    await replace(options).then(results => {
        console.log(`Connectors/basic.sol has changed`, results[0].hasChanged);
    }).catch(error => {
        console.error(`Connectors/basic.sol`, error);
    });

    // wait untill `truffle watch` compile the contracts again.
    await pause(10);
    return;
}

function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }