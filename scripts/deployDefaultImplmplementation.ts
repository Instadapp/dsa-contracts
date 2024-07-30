import hre from "hardhat";
import addresses from "./constant/addresses";
import instaDeployContract from "./deployContract";

async function main() {
const INSTA_INDEX = addresses.InstaIndex[hre.network.name];
  const instaAccountV2DefaultImpl = await instaDeployContract(
    "InstaDefaultImplementation",
    [INSTA_INDEX]
  );

  if (hre.network.name !== "hardhat") {
    await hre.run("verify:verify", {
      address: instaAccountV2DefaultImpl.address,
      constructorArguments: [INSTA_INDEX],
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
