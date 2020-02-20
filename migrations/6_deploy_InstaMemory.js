const InstaMemory = artifacts.require("InstaMemory");

module.exports = async function(deployer) {
    await deployer.deploy(InstaMemory); // deploy memoryVar.sol connector.
};