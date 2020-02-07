const basicConnector = artifacts.require("ConnectBasic");
const mVar = artifacts.require("InstaMemory");

const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer) {
    await changeBasicConnectMemoryVarAddr()
    await deployer.deploy(basicConnector); // deploy basic.sol connector.
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    await connectersInstance.enable(basicConnector.address) // enable basic.sol connector in connectors.sol contract.
};

// change mvar variable in basic.sol connector.
async function changeBasicConnectMemoryVarAddr() { 
    var mvarInstance = await mVar.deployed(); //memoryVar.sol contract instance
    console.log("\mVar Address:", mvarInstance.address)

    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/basic.sol');
    const options = {
        files: filePath,
        from: /return (.*);\/\/InstaMemory Address/,
        to: `return ${mvarInstance.address};//InstaMemory Address`,
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