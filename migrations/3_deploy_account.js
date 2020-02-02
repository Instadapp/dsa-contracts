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
        console.log(`Connectors/Auth.sol has changed`, results[0].hasChanged);
    }).catch(error => {
        console.error(`Connectors/Auth.sol`, error);
    });
    await pause(10);
    return;
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
    var connectorsInsance = await connectorsContract.deployed();
    var listInsance = await listContract.deployed();
    console.log("account.sol Address:", accountInstance.address)
    console.log("list.sol Address:", listInsance.address)
    console.log("connectors.sol Address:", connectorsInsance.address)
    console.log("\nIndex Address:", indexInstance.address)
    console.log("account.sol contract index variable Address:",await accountInstance.index())
    console.log("list.sol contract index variable Address:",await listInsance.index())
    console.log("connectors.sol contract index variable Address:",await connectorsInsance.index())

    return await indexInstance.setBasics(
        accounts[0],
        listInsance.address,
        accountInstance.address,
        connectorsInsance.address
    );
}

function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }