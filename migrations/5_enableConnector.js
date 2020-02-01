module.exports = async function(deployer) {
    var authConnectorInstance = await artifacts.require("SmartAuth").deployed();
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    await connectersInstance.enable(authConnectorInstance.address)
};