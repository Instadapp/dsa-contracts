const mVar = artifacts.require("InstaMemory");

module.exports = async function(deployer) {
    await deployer.deploy(mVar); // deploy memoryVar.sol connector.
};