const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount")

module.exports = async function(deployer, networks, accounts) {
    await deployOtherContracts(deployer); // deploy other 3 contracts => account.sol, connectors.sol, list.sol
    await setBasicIndex(accounts) // update the (account.sol, connectors.sol, list.sol) contracts address in InstaIndex contract
};

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
    console.log("account.sol contract index variable Address:",await accountInstance.instaIndex())
    console.log("list.sol contract index variable Address:",await listInsance.instaIndex())
    console.log("connectors.sol contract index variable Address:",await connectorsInsance.instaIndex())
    
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