
module.exports = async function(deployer) {
    await deployer.deploy(artifacts.require("SmartAuth"));
    await pause(10)
};

function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }