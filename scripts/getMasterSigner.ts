import hre from "hardhat";
const { ethers } = hre;
const INSTA_INDEX = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";

export default async function () {
  const instaIndex = await ethers.getContractAt("InstaIndex", INSTA_INDEX);

  const masterAddress = await instaIndex.master(); // TODO: make it constant?
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [masterAddress],
  });

  return ethers.provider.getSigner(masterAddress);
}
