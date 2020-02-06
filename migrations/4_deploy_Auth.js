
module.exports = async function(deployer) {
    await deployer.deploy(artifacts.require("ConnectAuth")); //deploy auth.sol connector contract
};