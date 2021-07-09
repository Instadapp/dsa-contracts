import { ethers, network } from "hardhat";
import { INSTA_INDEX } from "../store";
import { InstaIndex } from "../typechain";

export default async function getMasterSigner() {
  const instaIndex = <InstaIndex>(
    await ethers.getContractAt("InstaIndex", INSTA_INDEX)
  );

  const masterAddress = await instaIndex.master();
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [masterAddress],
  });

  return await ethers.provider.getSigner(masterAddress);
}
