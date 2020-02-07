
const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer) {
    await changeBasicConnectMemoryVarAddr()
};

// change mvar variable in basic.sol connector.
async function changeBasicConnectMemoryVarAddr() { 
    var mvarInstance = await artifacts.require("InstaMemory").deployed(); //memoryVar.sol contract instance
    console.log("\nInstaMemory Address:", mvarInstance.address)

    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/basic.sol');
    const options = {
        files: filePath,
        from: /return (.*); \/\/InstaMemory Address/,
        to: `return ${mvarInstance.address}; //InstaMemory Address`,
        };
    
    //replace the mvar address in the basic connector contract.
    replace(options).then(results => {
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