const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount")

const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer, networks, accounts) {
    await deployOtherContracts(deployer);
    await setBasicIndex(accounts)
    await changeAuthConnectListAddr()
};

async function changeAuthConnectListAddr() {
    var listInstance = await listContract.deployed();
    console.log("List Address:", listInstance.address)
    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/Auth.sol');
    const options = {
        files: filePath,
        from: /return (.*);\/\/InstaList Address/,
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



async function setBasicIndex(accounts) {
    var indexInstance = await indexContract.deployed();
    var accountInstance = await artifacts.require("InstaAccount").deployed();
    var ConnectorsInsance = await connectorsContract.deployed();
    var listInsance = await listContract.deployed();
    console.log("Index Address:", indexInstance.address)
    console.log("Account's index variable Address:",await accountInstance.index())
    return await indexInstance.setBasics(
        accounts[0],
        listInsance.address,
        accountInstance.address,
        ConnectorsInsance.address
    );


}



function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }