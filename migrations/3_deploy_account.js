const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount")

const path = require('path');
const replace = require('replace-in-file');

module.exports = async function(deployer, networks, accounts) {
    await deployOtherContracts(deployer); // deploy other 3 contracts => account.sol, connectors.sol, list.sol
    await setBasicIndex(accounts) // update the (account.sol, connectors.sol, list.sol) contracts address in InstaIndex contract
    await changeAuthConnectListAddr() // change listAddr variable in auth.sol connector.
};

// change listAddr variable in auth.sol connector.
async function changeAuthConnectListAddr() { 
    var listInstance = await listContract.deployed(); //list.sol contract instance
    console.log("\nList Address:", listInstance.address)

    const filePath = path.resolve(__dirname, '../contracts', 'Connectors/Auth.sol');
    const options = {
        files: filePath,
        from: /return (.*);\/\/InstaList Address/,
        to: `return ${listInstance.address};//InstaList Address`,
        };
    
    //replace the list address in the auth connector contract.
    replace(options).then(results => {
        console.log(`Connectors/Auth.sol has changed`, results[0].hasChanged);
    }).catch(error => {
        console.error(`Connectors/Auth.sol`, error);
    });

    // wait untill `truffle watch` compile the contracts again.
    await pause(10);
    return;
}

// deploy 3 other contracts
async function deployOtherContracts(deployer) {
    await deployer.deploy(connectorsContract)
    await deployer.deploy(artifacts.require("InstaAccount"))
    await deployer.deploy(listContract)
    return;
}


// update the (account.sol, connectors.sol, list.sol) contracts address 
// in InstaIndex contract using `setBasics()` function
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
    
    //set master address, account.sol, connectors.sol, list.sol contract's addresses in index.sol deployed contract.
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