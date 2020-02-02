const basicConnector = artifacts.require("basic");

module.exports = async function(deployer) {
    await deployer.deploy(basicConnector); // deploy basic.sol connector.
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    await connectersInstance.enable(basicConnector.address) // enable basic.sol connector in connectors.sol contract.
};