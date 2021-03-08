const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy();
    await instaConnectorsV2.deployed();

    console.log("InstaConnectorsV2 deployed: ", instaConnectorsV2.address);

    const InstaImplementations = await ethers.getContractFactory("InstaImplementations");
    const implementationsMapping = await InstaImplementations.deploy();
    await implementationsMapping.deployed();

    console.log("InstaImplementations deployed: ", implementationsMapping.address);

    const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
    const instaAccountV2Proxy = await InstaAccountV2.deploy(implementationsMapping.address);
    await instaAccountV2Proxy.deployed();

    console.log("InstaAccountV2 deployed: ", instaAccountV2Proxy.address);

    const InstaDefaultImplementation = await ethers.getContractFactory("InstaDefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy();
    await instaAccountV2DefaultImpl.deployed();

    console.log("InstaDefaultImplementation deployed: ", instaAccountV2DefaultImpl.address);

    const InstaImplementationM1 = await ethers.getContractFactory("InstaImplementationM1");
    const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(instaConnectorsV2.address);
    await instaAccountV2ImplM1.deployed();

    console.log("InstaImplementationM1 deployed: ", instaAccountV2ImplM1.address);

    await hre.run("verify:verify", {
        address: instaConnectorsV2.address,
        constructorArguments: []
      }
    )

    await hre.run("verify:verify", {
        address: implementationsMapping.address,
        constructorArguments: []
      }
    )

    await hre.run("verify:verify", {
        address: instaAccountV2DefaultImpl.address,
        constructorArguments: []
      }
    )

    await hre.run("verify:verify", {
        address: instaAccountV2ImplM1.address,
        constructorArguments: [instaConnectorsV2.address]
      }
    )

    await hre.run("verify:verify", {
        address: instaAccountV2Proxy.address,
        constructorArguments: [implementationsMapping.address]
      }
    )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });