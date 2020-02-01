const basicConnector = artifacts.require("basic");

module.exports = async function(deployer) {
    await deployer.deploy(basicConnector);
};