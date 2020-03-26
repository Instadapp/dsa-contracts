module.exports = async function(deployer) {
    //enable auth.sol connector in connectors.sol contract.
    var authConnectorInstance = await artifacts.require("ConnectAuth").deployed();
    var connectersInstance = await artifacts.require("InstaConnectors").deployed();
    //enable auth.sol
    await connectersInstance.enable(authConnectorInstance.address)
};