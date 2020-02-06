const mVar = artifacts.require("MemoryVar");

module.exports = async function(deployer) {
    await deployer.deploy(mVar); // deploy memoryVar.sol connector.
};