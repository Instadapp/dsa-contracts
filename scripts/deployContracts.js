const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function () {
    const instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)
      
    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy(instaIndex.address);
    await instaConnectorsV2.deployed();

    const InstaImplementations = await ethers.getContractFactory("InstaImplementations");
    const implementationsMapping = await InstaImplementations.deploy(instaIndex.address);
    await implementationsMapping.deployed();
    
    const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
    const instaAccountV2Proxy = await InstaAccountV2.deploy(implementationsMapping.address);
    await instaAccountV2Proxy.deployed();

    const InstaDefaultImplementation = await ethers.getContractFactory("InstaDefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(instaIndex.address);
    await instaAccountV2DefaultImpl.deployed();

    const InstaImplementationM1 = await ethers.getContractFactory("InstaImplementationM1");
    const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(instaIndex.address, instaConnectorsV2.address);
    await instaAccountV2ImplM1.deployed();

    const InstaImplementationM2 = await ethers.getContractFactory("InstaImplementationM2");
    const instaAccountV2ImplM2 = await InstaImplementationM2.deploy(instaIndex.address, instaConnectorsV2.address);
    await instaAccountV2ImplM2.deployed();


    return {
        instaIndex,
        instaConnectorsV2,
        implementationsMapping,
        instaAccountV2Proxy,
        instaAccountV2DefaultImpl,
        instaAccountV2ImplM1,
        instaAccountV2ImplM2
    }
};
