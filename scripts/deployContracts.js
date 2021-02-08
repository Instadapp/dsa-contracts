const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function () {
    const instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)
      
    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy();
    await instaConnectorsV2.deployed();

    const InstaAccountImplementations = await ethers.getContractFactory("InstaAccountImplementations");
    const implementationsMapping = await InstaAccountImplementations.deploy();
    await implementationsMapping.deployed();
    
    const InstaAccountV2Proxy = await ethers.getContractFactory("InstaAccountV2Proxy");
    const instaAccountV2Proxy = await InstaAccountV2Proxy.deploy(implementationsMapping.address);
    await instaAccountV2Proxy.deployed();

    const InstaAccountV2DefaultImplementation = await ethers.getContractFactory("InstaAccountV2DefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaAccountV2DefaultImplementation.deploy();
    await instaAccountV2DefaultImpl.deployed();

    const InstaAccountV2ImplementationM1 = await ethers.getContractFactory("InstaAccountV2ImplementationM1");
    const instaAccountV2ImplM1 = await InstaAccountV2ImplementationM1.deploy();
    await instaAccountV2ImplM1.deployed();

    const InstaAccountV2ImplementationM2 = await ethers.getContractFactory("InstaAccountV2ImplementationM2");
    const instaAccountV2ImplM2 = await InstaAccountV2ImplementationM2.deploy();
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
