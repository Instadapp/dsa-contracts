const basicConnector = artifacts.require("basic");

module.exports = async function(deployer) {
    await deployer.deploy(basicConnector);
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    await connectersInstance.enable(basicConnector.address)
};