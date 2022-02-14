import hre from "hardhat";
const { ethers } = hre;

export default async function (
  factoryName: string,
  constructorArguments: Array<string | Array<string>>
) {
  const contractInstance = await ethers.getContractFactory(factoryName);
  const contract = await contractInstance.deploy(...constructorArguments);
  await contract.deployed();

  console.log(
    `Contract ${factoryName} deployed at ${contract.address} on ${hre.network.name}`
  );

  return contract;
}
