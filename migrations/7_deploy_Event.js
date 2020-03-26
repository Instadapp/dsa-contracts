const EventContract = artifacts.require("InstaEvent");

module.exports = async function(deployer) {
    await deployer.deploy(EventContract); // deploy event.sol .
};