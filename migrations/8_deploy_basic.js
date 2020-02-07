module.exports = async function(deployer) {
    await deployer.deploy(artifacts.require("ConnectBasic")); // deploy basic.sol connector.
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    await connectersInstance.enable(artifacts.require("ConnectBasic").address) // enable basic.sol connector in connectors.sol contract.
};
