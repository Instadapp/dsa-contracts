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

  const deployedContract = {
    // "InstaIndex": "0x6CE3e607C808b4f4C26B7F6aDAeB619e49CAbb25",
    // "InstaList": "0x9926955e0Dd681Dc303370C52f4Ad0a4dd061687",
    "versions": {
      "v1": {
        // "InstaAccount": "0xA9B99766E6C676Cf1975c0D3166F96C0848fF5ad",
        // "InstaConnectors": "0x839c2D3aDe63DF5b0b8F3E57D5e145057Ab41556",
        // "InstaEvent": "0xA7c805e4ad4E7B51d2a1eB442B2014a9B63D3703",
        // "InstaMemory": "0x3254Ce8f5b1c82431B8f21Df01918342215825C2"
      },
      "v2": {
      //   "InstaAccountV2": "0x0a0a82D2F86b9E46AE60E22FCE4e8b916F858Ddc",
      //   "InstaConnectorsV2Proxy": "0x6C7256cf7C003dD85683339F75DdE9971f98f2FD",
      //   "InstaConnectorsV2": "0x127d8cD0E2b2E0366D522DeA53A787bfE9002C14",
      //   "InstaImplementations": "0x01fEF4d2B513C9F69E34b2f93Ef707FA9Ff60109",
      //   "InstaDefaultImplementation": "0x39d3d5e7c11D61E072511485878dd84711c19d4A",
      //   "InstaImplementationM1": "0x28846f4051EB05594B3fF9dE76b7B5bf00431155",
      //   "InstaConnectorsV2EmptyImplementation": "0xa4bf319968986d2352fa1c550d781bbfcce3fcab" 
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
    await sleep(2000)
    
    if (deployedContractAddress) {
      const isDeployed = await ethers.provider.getCode(deployedContractAddress).then(a => a != "0x")
      if (!isDeployed) throw new Error("contract not deployed")
      return await ethers.getContractAt(contractName, deployedContractAddress, deployer) 
    } else {
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

  console.log("\n########### setBasics ########");

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
  console.log("###########");

  console.log("\n########### Add DSAv2 Implementations ########");
  let txSetDefaultImplementation = await implementationsMapping.setDefaultImplementation(
    instaAccountV2DefaultImpl.address
  );
  let txSetDefaultImplementationDetails = await txSetDefaultImplementation.wait();

  const implementationV1Args: [string, BytesLike[]] = [
    instaAccountV2ImplM1.address,
    ["cast(string[],bytes[],address)"].map((a) =>
      web3.utils.keccak256(a).slice(0, 10)
    ),
  ];
  const txAddImplementation = await implementationsMapping.addImplementation(
    ...implementationV1Args
  );
  const txAddImplementationDetails = await txAddImplementation.wait();
  console.log(`
        status: ${txAddImplementationDetails.status == 1},
        tx: ${txAddImplementationDetails.transactionHash},
      `);
  console.log("###########\n");

  console.log("\n\n########### Add DSAv2 ########");
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
  console.log("###########\n");

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

  if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
    // InstaIndex
    await hre.run("verify:verify", {
      address: instaIndex.address,
      constructorArguments: [],
    });

    // InstaList
    await hre.run("verify:verify", {
      address: instaList.address,
      constructorArguments: [instaIndex.address],
    });

    // InstaAccount
    await hre.run("verify:verify", {
      address: instaAccount.address,
      constructorArguments: [instaIndex.address],
    });

    // InstaConnectors
    await hre.run("verify:verify", {
      address: instaConnectors.address,
      constructorArguments: [instaIndex.address],
    });

    // InstaEvent
    await hre.run("verify:verify", {
      address: instaEvent.address,
      constructorArguments: [instaList.address],
    });

    // InstaMemory
    await hre.run("verify:verify", {
      address: instaMemory.address,
      constructorArguments: [],
    });

    // v2
    await hre.run("verify:verify", {
      address: instaConnectorsV2Impl.address,
      constructorArguments: [],
      contract:
        "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl",
    });
    await hre.run("verify:verify", {
      address: instaConnectorsV2Proxy.address,
      constructorArguments: [
        instaConnectorsV2Impl.address,
        "0x9800020b610194dBa52CF606E8Aa142F9F256166",
        "0x",
      ],
      contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy",
    });

    await hre.run("verify:verify", {
      address: instaConnectorsV2.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: implementationsMapping.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2DefaultImpl.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2ImplM1.address,
      constructorArguments: [instaConnectorsV2.address],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2Proxy.address,
      constructorArguments: [implementationsMapping.address],
    });
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
