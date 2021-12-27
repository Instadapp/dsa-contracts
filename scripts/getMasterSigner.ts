import hre from "hardhat";
const { ethers } = hre;
import addresses from "./constant/addresses";

const INSTA_INDEX = addresses.InstaIndex[String(process.env.networkType)];

export default async function () {
  const instaIndex = await ethers.getContractAt("InstaIndex", INSTA_INDEX);

  const masterAddress = await instaIndex.master(); // TODO: make it constant?
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [masterAddress],
  });

  return ethers.provider.getSigner(masterAddress);
}
