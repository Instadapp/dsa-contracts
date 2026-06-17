import { BytesLike } from "ethers";
import hre from "hardhat";
const { web3, ethers } = hre;
import instaDeployContract from "./deployContract";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log(`Deployer Address: ${deployerAddress}`);

  console.log(" Deploying Contracts to", hre.network.name, "...");

  const deployedContract =  {
    // "InstaIndex": "0x17417f8cA2f6e4Ad49F9B561a66D3dE7DdE6db1c",
    // "InstaList": "0xdF791173aFd1798718D7d1dd6E37366D1907bB02",
    "versions": {
      "v1": {
        // "InstaAccount": "0x497Bc53507DF17e60F731e9534cff74E8BC9DBb8",
        // "InstaConnectors": "0xcD7661f786D5fd6b87ee33497Dd9cCD3b2702012",
        // "InstaEvent": "0x8358A92707824476f0d788075D53b627E85490a7",
        // "InstaMemory": "0x89305678Cc853A929428fA6a97ab35bD864e3F14"
      },
      "v2": {
        // "InstaAccountV2": "0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC",
        // "InstaConnectorsV2Proxy": "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb",
        // "InstaConnectorsV2": "0x171aeB3Ba7F12E67d3D3e2f523e6C02E1670cD33",
        // "InstaImplementations": "0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B",
        // "InstaDefaultImplementation": "0xf70FE590f1C47e327302bd13E615fE7d9608fae9",
        // "InstaImplementationM1": "0x697860CeE594c577F18f71cAf3d8B68D913c7366",
        // "InstaConnectorsV2EmptyImplementation": "0x31de2088f38ed7f8a4231de03973814eda1f8773"
      }
    }
  }
  
  const getDeployed = async (contractName, constructorArguments) => {
    let deployedContractAddress;
    switch (contractName) {
      case "InstaIndex":
      case "InstaList":
        deployedContractAddress = deployedContract?.[contractName];
        break;
      case "InstaAccount":
      case "InstaConnectors":
      case "InstaEvent":
      case "InstaMemory":
        deployedContractAddress = deployedContract?.versions?.v1[contractName];
        break;
      case "InstaConnectorsV2Proxy":
      case "InstaConnectorsV2":
      case "InstaAccountV2":
      case "InstaImplementations":
      case "InstaDefaultImplementation":
      case "InstaImplementationM1":
        deployedContractAddress = deployedContract?.versions?.v2[contractName];
        break;
      case "InstaConnectorsV2Impl": 
        deployedContractAddress = deployedContract?.versions?.v2["InstaConnectorsV2EmptyImplementation"];
        break;
      default:
        throw new Error(`not vaild ${contractName}`)
    }
    console.log(contractName, deployedContractAddress)
    
    if (deployedContractAddress) {
      const isDeployed = await ethers.provider.getCode(deployedContractAddress).then(a => a != "0x")
      if (!isDeployed) throw new Error("contract not deployed")
        return await ethers.getContractAt(contractName, deployedContractAddress, deployer) 
    } else {
      await sleep(2000)
      return await instaDeployContract(contractName, constructorArguments);
    }
  }

  const instaIndex = await getDeployed("InstaIndex", []);

  const instaList = await getDeployed("InstaList", [
    instaIndex.address,
  ]);

  const instaAccount = await getDeployed("InstaAccount", [
    instaIndex.address,
  ]);

  const instaConnectors = await getDeployed("InstaConnectors", [
    instaIndex.address,
  ]);

  const instaEvent = await getDeployed("InstaEvent", [
    instaList.address,
  ]);

  const instaMemory = await getDeployed("InstaMemory", []);

  const instaConnectorsV2Impl = await getDeployed(
    "InstaConnectorsV2Impl",
    []
  );

  const instaConnectorsV2Proxy = await getDeployed(
    "InstaConnectorsV2Proxy",
    [
      instaConnectorsV2Impl.address,
      "0x9800020b610194dBa52CF606E8Aa142F9F256166",
      "0x",
    ]
  );

  const instaConnectorsV2 = await getDeployed("InstaConnectorsV2", [
    instaIndex.address,
  ]);

  const implementationsMapping = await getDeployed(
    "InstaImplementations",
    [instaIndex.address]
  );

  const instaAccountV2Proxy = await getDeployed("InstaAccountV2", [
    implementationsMapping.address,
  ]);

  const instaAccountV2DefaultImpl = await getDeployed(
    "InstaDefaultImplementation",
    [instaIndex.address]
  );

  const instaAccountV2ImplM1 = await getDeployed(
    "InstaImplementationM1",
    [instaIndex.address, instaConnectorsV2.address]
  );

    {
      console.log("\n########### setBasics ########");
      const master = await instaIndex.functions.master()
      if (master == ethers.constants.AddressZero) {
        const setBasicsArgs: [string, string, string, string] = [
          deployerAddress,
          instaList.address,
          instaAccount.address,
          instaConnectors.address,
        ];
      
        const tx = await instaIndex.setBasics(...setBasicsArgs);
        const txDetails = await tx.wait();
        console.log(`
                status: ${txDetails.status == 1},
                tx: ${txDetails.transactionHash},
              `);
      } else {
        console.log("setBasis already initiated")
      }
      console.log("###########");
    }
   
    {
      console.log("\n########### Add DSAv2 Implementations ########");

      const defaultImplementation = await implementationsMapping.functions.defaultImplementation()

      if (defaultImplementation == ethers.constants.AddressZero) {
        let txSetDefaultImplementation = await implementationsMapping.setDefaultImplementation(
          instaAccountV2DefaultImpl.address
        );
        let txSetDefaultImplementationDetails = await txSetDefaultImplementation.wait();
      } else {
        console.log("default implementation set")
      }

      const implementationV1Args: [string, BytesLike[]] = [
        instaAccountV2ImplM1.address,
        ["cast(string[],bytes[],address)"].map((a) =>
          web3.utils.keccak256(a).slice(0, 10)
        ),
      ];

      const implementationAddress = await implementationsMapping.callStatic.getSigImplementation(implementationV1Args[1][0])
      
      if (implementationAddress == instaAccountV2ImplM1.address) {
        console.log("instaAccountV2ImplM1 is set")
      } else if (implementationAddress != instaAccountV2ImplM1.address) {
        throw new Error("Wrong instaAccountV2ImplM1 is set")
      } else {
        const txAddImplementation = await implementationsMapping.addImplementation(
          ...implementationV1Args
        );
        const txAddImplementationDetails = await txAddImplementation.wait();
        console.log(`
              status: ${txAddImplementationDetails.status == 1},
              tx: ${txAddImplementationDetails.transactionHash},
            `);
        }
        console.log("###########\n");
    }
    
    {
      console.log("\n\n########### Add DSAv2 ########");
      
      const instaAccountV2AddressOnInstaIndex = await instaIndex.callStatic.account(2)

      if (instaAccountV2AddressOnInstaIndex == instaAccountV2Proxy.address) {
        console.log("InstaAccountV2Proxy set on InstaIndex")
      } else if (instaAccountV2AddressOnInstaIndex != instaAccountV2Proxy.address) {
        throw new Error("InstaAccountV2Proxy set wrong on InstaIndex")
      } else {
        const addNewAccountArgs: [string, string, string] = [
          instaAccountV2Proxy.address,
          instaConnectorsV2Proxy.address,
          ethers.constants.AddressZero,
        ];
        const txAddNewAccount = await instaIndex.addNewAccount(...addNewAccountArgs);
        const txDetailsAddNewAccount = await txAddNewAccount.wait();
      
        console.log(`
                status: ${txDetailsAddNewAccount.status == 1},
                tx: ${txDetailsAddNewAccount.transactionHash},
            `);
      }
      console.log("###########\n");
    }

  console.log("Contract Deployment",  JSON.stringify(
    {
      "InstaIndex": instaIndex.address,
      "InstaList": instaList.address,
      "versions": {
        "v1": {
          "InstaAccount": instaAccount.address,
          "InstaConnectors": instaConnectors.address,
          "InstaEvent": instaEvent.address,
          "InstaMemory": instaMemory.address
        },
        "v2": {
          "InstaAccountV2": instaAccountV2Proxy.address,
          "InstaConnectorsV2Proxy": instaConnectorsV2Proxy.address,
          "InstaConnectorsV2": instaConnectorsV2.address,
          "InstaImplementations": implementationsMapping.address,
          "InstaDefaultImplementation": instaAccountV2DefaultImpl.address,
          "InstaImplementationM1": instaAccountV2ImplM1.address,
          "InstaConnectorsV2EmptyImplementation": instaConnectorsV2Impl.address
        }
      }
    }, null, 2)
  )

  if (hre.network.name != "hardhat") {
    // InstaIndex
    await hre.run("verify:verify", {
      address: instaIndex.address,
      constructorArguments: [],
    }).catch(console.error)

    // InstaList
    await hre.run("verify:verify", {
      address: instaList.address,
      constructorArguments: [instaIndex.address],
    }).catch(console.error)

    // InstaAccount
    await hre.run("verify:verify", {
      address: instaAccount.address,
      constructorArguments: [instaIndex.address],
    }).catch(console.error)

    // InstaConnectors
    await hre.run("verify:verify", {
      address: instaConnectors.address,
      constructorArguments: [instaIndex.address],
    }).catch(console.error)

    // InstaEvent
    await hre.run("verify:verify", {
      address: instaEvent.address,
      constructorArguments: [instaList.address],
    }).catch(console.error)

    // InstaMemory
    await hre.run("verify:verify", {
      address: instaMemory.address,
      constructorArguments: [],
    }).catch(console.error)

    // v2
    await hre.run("verify:verify", {
      address: instaConnectorsV2Impl.address,
      constructorArguments: [],
      contract:
        "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl",
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: instaConnectorsV2Proxy.address,
      constructorArguments: [
        instaConnectorsV2Impl.address,
        "0x9800020b610194dBa52CF606E8Aa142F9F256166",
        "0x",
      ],
      contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy",
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: instaConnectorsV2.address,
      constructorArguments: [ instaIndex.address ],
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: implementationsMapping.address,
      constructorArguments: [instaIndex.address],
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: instaAccountV2DefaultImpl.address,
      constructorArguments: [instaIndex.address],
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: instaAccountV2ImplM1.address,
      constructorArguments: [instaIndex.address, instaConnectorsV2.address],
    }).catch(console.error)

    await hre.run("verify:verify", {
      address: instaAccountV2Proxy.address,
      constructorArguments: [implementationsMapping.address],
    }).catch(console.error)
  } else {
    console.log("Contracts deployed to", hre.network.name);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
