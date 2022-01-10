import { BytesLike } from "ethers";
import hre from "hardhat";
const { web3, ethers } = hre;
import instaDeployContract from "./deployContract";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log(`Deployer Address: ${deployerAddress}`);

  console.log(" Deploying Contracts to", hre.network.name, "...");

  const instaIndex = await instaDeployContract("InstaIndex", []);

  const instaList = await instaDeployContract("InstaList", [
    instaIndex.address,
  ]);

  const instaAccount = await instaDeployContract("InstaAccount", [
    instaIndex.address,
  ]);

  const instaConnectors = await instaDeployContract("InstaConnectors", [
    instaIndex.address,
  ]);

  const instaEvent = await instaDeployContract("InstaEvent", [
    instaList.address,
  ]);

  const instaMemory = await instaDeployContract("InstaMemory", []);

  const instaConnectorsV2Impl = await instaDeployContract(
    "InstaConnectorsV2Impl",
    []
  );

  const instaConnectorsV2Proxy = await instaDeployContract(
    "InstaConnectorsV2Proxy",
    [
      instaConnectorsV2Impl.address,
      "0x9800020b610194dBa52CF606E8Aa142F9F256166",
      "0x",
    ]
  );

  const instaConnectorsV2 = await instaDeployContract("InstaConnectorsV2", [
    instaIndex.address,
  ]);

  const implementationsMapping = await instaDeployContract(
    "InstaImplementations",
    [instaIndex.address]
  );

  const instaAccountV2Proxy = await instaDeployContract("InstaAccountV2", [
    implementationsMapping.address,
  ]);

  const instaAccountV2DefaultImpl = await instaDeployContract(
    "InstaDefaultImplementation",
    [instaIndex.address]
  );

  const instaAccountV2ImplM1 = await instaDeployContract(
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

  if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
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
