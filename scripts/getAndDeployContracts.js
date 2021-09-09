const hre = require("hardhat");
const { ethers, waffle } = hre;
const { provider } = waffle

module.exports = async function () {
    const wallets = provider.getWallets()
    let [wallet0] = wallets
    const instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)
      
    const InstaConnectorsV2 = await ethers.getContractAt("InstaConnectorsV2", "0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11");
    const instaConnectorsV2 = await InstaConnectorsV2.connect(wallet0)

    const InstaImplementations = await ethers.getContractAt("InstaImplementations", "0xCBA828153d3a85b30B5b912e1f2daCac5816aE9D");
    const implementationsMapping = await InstaImplementations.connect(wallet0)
    
    
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
