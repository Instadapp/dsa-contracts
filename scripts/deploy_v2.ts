import hre from "hardhat";
const { ethers } = hre;
import addresses from "./constant/addresses";
import instaDeployContract from "./deployContract";

const networkType = String(process.env.networkType) ?? "mainnet";
const INSTA_INDEX = addresses.InstaIndex[networkType];

async function main() {
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
    INSTA_INDEX,
  ]);

  const implementationsMapping = await instaDeployContract(
    "InstaImplementations",
    [INSTA_INDEX]
  );

  const instaAccountV2Proxy = await instaDeployContract("InstaAccountV2", [
    implementationsMapping.address,
  ]);

  const instaAccountV2DefaultImpl = await instaDeployContract(
    "InstaDefaultImplementation",
    [INSTA_INDEX]
  );

  const instaAccountV2ImplM1 = await instaDeployContract(
    "InstaImplementationM1",
    [INSTA_INDEX, instaConnectorsV2.address]
  );

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
      address: "0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11",
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: implementationsMapping.address,
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2DefaultImpl.address,
      constructorArguments: [INSTA_INDEX],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2ImplM1.address,
      constructorArguments: [INSTA_INDEX, instaConnectorsV2.address],
    });

    await hre.run("verify:verify", {
      address: instaAccountV2Proxy.address,
      constructorArguments: [implementationsMapping.address],
    });
  } else {
    console.log(`Contracts deployed to ${hre.network.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
