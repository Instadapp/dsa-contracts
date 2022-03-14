import hre from "hardhat";
const { ethers } = hre;
import addresses from "./constant/addresses";
import instaDeployContract from "./deployContract";

const networkType = process.env.networkType ?? "mainnet";
const INSTA_INDEX = addresses.InstaIndex[networkType];

export default async function () {
  const instaIndex = await ethers.getContractAt("InstaIndex", INSTA_INDEX);

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

  const instaAccountV2ImplM2 = await instaDeployContract(
    "InstaImplementationM2",
    [instaIndex.address, instaConnectorsV2.address]
  );

  return {
    instaIndex,
    instaConnectorsV2,
    implementationsMapping,
    instaAccountV2Proxy,
    instaAccountV2DefaultImpl,
    instaAccountV2ImplM1,
    instaAccountV2ImplM2,
  };
}
