const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy();
    await instaConnectorsV2.deployed();

    console.log("InstaConnectorsV2 deployed: ", instaConnectorsV2.address);

    const InstaAccountImplementations = await ethers.getContractFactory("InstaAccountImplementations");
    const implementationsMapping = await InstaAccountImplementations.deploy();
    await implementationsMapping.deployed();

    console.log("InstaAccountImplementations deployed: ", implementationsMapping.address);

    const InstaAccountV2Proxy = await ethers.getContractFactory("InstaAccountV2Proxy");
    const instaAccountV2Proxy = await InstaAccountV2Proxy.deploy(implementationsMapping.address);
    await instaAccountV2Proxy.deployed();

    console.log("instaAccountV2Proxy deployed: ", instaAccountV2Proxy.address);

    const InstaAccountV2DefaultImplementation = await ethers.getContractFactory("InstaAccountV2DefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaAccountV2DefaultImplementation.deploy();
    await instaAccountV2DefaultImpl.deployed();

    console.log("InstaAccountV2DefaultImplementation deployed: ", instaAccountV2DefaultImpl.address);

    const InstaAccountV2ImplementationM1 = await ethers.getContractFactory("InstaAccountV2ImplementationM1");
    const instaAccountV2ImplM1 = await InstaAccountV2ImplementationM1.deploy(instaConnectorsV2.address);
    await instaAccountV2ImplM1.deployed();

    console.log("InstaAccountV2ImplementationM1 deployed: ", instaAccountV2ImplM1.address);

    // await hre.run("verify:verify", {
    //     address: instaConnectorsV2.address,
    //     constructorArguments: []
    //   }
    // )

    // await hre.run("verify:verify", {
    //     address: implementationsMapping.address,
    //     constructorArguments: []
    //   }
    // )

    // await hre.run("verify:verify", {
    //     address: instaAccountV2Proxy.address,
    //     constructorArguments: [implementationsMapping.address]
    //   }
    // )

    // await hre.run("verify:verify", {
    //     address: instaAccountV2DefaultImpl.address,
    //     constructorArguments: []
    //   }
    // )

    // await hre.run("verify:verify", {
    //     address: instaAccountV2ImplM1.address,
    //     constructorArguments: [instaConnectorsV2.address]
    //   }
    // )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });