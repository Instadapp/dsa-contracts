import hre from "hardhat";
const { ethers } = hre;
import instaDeployContract from "./deployContract";

async function main() {
  const chiefMultiSig = "0xa8c31E39e40E6765BEdBd83D92D6AA0B33f1CCC5";

  const instaTimelockContract = await instaDeployContract(
    "InstaChiefTimelockContract",
    [[chiefMultiSig]]
  );

  if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
    await hre.run("verify:verify", {
      address: instaTimelockContract.address,
      constructorArguments: [[chiefMultiSig]],
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
