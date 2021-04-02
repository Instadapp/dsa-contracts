const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying Contracts to mainnet. Hit ctrl + c to abort"
      );
    } else if (hre.network.name === "kovan") {
      console.log(
        "\n\n Deploying Contracts to kovan..."
      );
    } else {
        console.log(
            "\n\n Deploying Contracts to", hre.network.name, "..." 
         );
    }

    
    const InstaIndex = await ethers.getContractFactory("InstaIndex");
    const instaIndex = await InstaIndex.deploy();
    await instaIndex.deployed();
    
    const instaIndexAddress = instaIndex.address;
    console.log("instaIndex deployed: ", instaIndexAddress);


    const InstaList = await ethers.getContractFactory("InstaList");
    const instaList = await InstaList.deploy(instaIndexAddress);
    await instaList.deployed();

    console.log("instaList deployed: ", instaList.address);


    const InstaAccount = await ethers.getContractFactory("InstaAccount");
    const instaAccount = await InstaAccount.deploy(instaIndexAddress);
    await instaAccount.deployed();

    console.log("instaAccount deployed: ", instaAccount.address);


    const InstaConnectors = await ethers.getContractFactory("InstaConnectors");
    const instaConnectors = await InstaConnectors.deploy(instaIndexAddress);
    await instaConnectors.deployed();
    console.log("instaConnectors deployed: ", instaConnectors.address);


    const InstaEvent = await ethers.getContractFactory("InstaEvent");
    const instaEvent = await InstaEvent.deploy(instaList.address);
    await instaEvent.deployed();
    
    console.log("instaEvent deployed: ", instaEvent.address);


    const InstaMemory = await ethers.getContractFactory("InstaMemory");
    const instaMemory = await InstaMemory.deploy();
    await instaMemory.deployed();

    console.log("instaMemory deployed: ", instaMemory.address);


    const InstaConnectorsV2Impl = await ethers.getContractFactory("InstaConnectorsV2Impl");
    const instaConnectorsV2Impl = await InstaConnectorsV2Impl.deploy();
    await instaConnectorsV2Impl.deployed();

    console.log("InstaConnectorsV2 Impl deployed: ", instaConnectorsV2Impl.address);


    const InstaConnectorsV2Proxy = await ethers.getContractFactory("InstaConnectorsV2Proxy");
    const instaConnectorsV2Proxy = await InstaConnectorsV2Proxy.deploy(instaConnectorsV2Impl.address, "0x9800020b610194dBa52CF606E8Aa142F9F256166", "0x");
    await instaConnectorsV2Proxy.deployed();

    console.log("InstaConnectorsV2 Proxy deployed: ", instaConnectorsV2Proxy.address);

    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy(instaIndexAddress);
    await instaConnectorsV2.deployed();

    console.log("InstaConnectorsV2 deployed: ", instaConnectorsV2.address);

    const InstaImplementations = await ethers.getContractFactory("InstaImplementations");
    const implementationsMapping = await InstaImplementations.deploy(instaIndexAddress);
    await implementationsMapping.deployed();

    console.log("InstaImplementations deployed: ", implementationsMapping.address);

    const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
    const instaAccountV2Proxy = await InstaAccountV2.deploy(implementationsMapping.address);
    await instaAccountV2Proxy.deployed();

    console.log("InstaAccountV2 deployed: ", instaAccountV2Proxy.address);

    const InstaDefaultImplementation = await ethers.getContractFactory("InstaDefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(instaIndexAddress);
    await instaAccountV2DefaultImpl.deployed();

    console.log("InstaDefaultImplementation deployed: ", instaAccountV2DefaultImpl.address);

    const InstaImplementationM1 = await ethers.getContractFactory("InstaImplementationM1");
    const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(instaIndexAddress, instaConnectorsV2.address);
    await instaAccountV2ImplM1.deployed();

    console.log("InstaImplementationM1 deployed: ", instaAccountV2ImplM1.address);

    console.log("\n\n###########")
        const args = [
            "0xf6839085F692bDe6A8062573E3DA35E7e947C21E",
            instaList.address,
            instaAccount.address,
            instaConnectors.address
        ]
        const tx = await instaIndex.setBasics(...args)
        const txDetails = tx.wait()
    console.log("###########\n\n")


    if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
      await hre.run("verify:verify", {
          address: instaConnectorsV2Impl.address,
          constructorArguments: [],
          contract: "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl"
        }
      )
      await hre.run("verify:verify", {
          address: instaConnectorsV2Proxy.address,
          constructorArguments: [instaConnectorsV2Impl.address, "0x9800020b610194dBa52CF606E8Aa142F9F256166", "0x"],
          contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy"
        }
      )

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
    } else {
      console.log("Contracts deployed to", hre.network.name)
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });