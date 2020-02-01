const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");

const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer, networks, accounts) {
    await deployOtherContracts(deployer);
    await setBasicRegistry(accounts)
    await changeAuthConnectListAddr()
};

async function changeAuthConnectListAddr() {
    var listInstance = await listContract.deployed();
    console.log("List Address:", listInstance.address)
    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/Auth/Auth.sol');
    const options = {
        files: filePath,
        from: /return (.*)InstaList address/,
        to: `return ${listInstance.address};//InstaList Address`,
        };
    
    replace(options).then(results => {
        console.log(`Connectors/Auth/Auth.sol has changed`, results[0].hasChanged);
    }).catch(error => {
        console.error(`Connectors/Auth/Auth.sol`, error);
    });
    await pause(10)
}

async function deployOtherContracts(deployer) {
    await deployer.deploy(connectorsContract)
    await deployer.deploy(artifacts.require("InstaAccount"))
    await deployer.deploy(listContract)
    return;
}



async function setBasicRegistry(accounts) {
    var registryInstance = await indexContract.deployed();
    var SLAInstance = await artifacts.require("InstaAccount").deployed();
    var ConnectorsInsance = await connectorsContract.deployed();
    var listInsance = await listContract.deployed();
    console.log("Index Address:", registryInstance.address)
    console.log("Account's index variable Address:",await SLAInstance.registry())
    return await registryInstance.setBasics(
        accounts[0],
        listInsance.address,
        SLAInstance.address,
        ConnectorsInsance.address
    );


}



function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }