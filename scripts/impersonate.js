const { ethers, network } = require("hardhat");

module.exports = async (accounts) => {
  const signers = [];
  for (const account of accounts) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account],
    });

    signers.push(await ethers.getSigner(account));
  }

  return signers;
};
