const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function () {
    const instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)

    const masterAddress = await instaIndex.master(); // TODO: make it constant?
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ masterAddress]
    })

    return await ethers.provider.getSigner(masterAddress);
};
