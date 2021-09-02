const hre = require("hardhat");
const path = require("path");
const { promises, existsSync, mkdirSync, writeFileSync, rmdirSync } = require("fs");
const axios = require("axios");

const {
  getStorageLayout,
  getVersion,
  getUnlinkedBytecode,
  Manifest,
  isCurrentValidationData,
  assertStorageUpgradeSafe,
} = require("@openzeppelin/upgrades-core");

require("dotenv").config()

const getStorageLayoutForContract = async (hre, contractName) => {
  const { provider } = hre.network;
  const manifest = await Manifest.forNetwork(provider);
  const validations = await readValidations(hre);
  const implFactory = await hre.ethers.getContractFactory(contractName);
  const unlinkedBytecode = getUnlinkedBytecode(
    validations,
    implFactory.bytecode
  );
  const version = getVersion(unlinkedBytecode, implFactory.bytecode);

  return getStorageLayout(validations, version);
};

function getValidationsCachePath(hre) {
  return path.join(hre.config.paths.cache, "validations.json");
}

const readValidations = async (hre) => {
  const cachePath = getValidationsCachePath(hre);
  try {
    const data = JSON.parse(await promises.readFile(cachePath, "utf8"));
    if (!isCurrentValidationData(data)) {
      await promises.unlink(cachePath);
      throw new ValidationsCacheOutdated();
    }
    return data;
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new ValidationsCacheNotFound();
    } else {
      throw e;
    }
  }
};

const onChainContractInfo = (address) => {
  const url = "https://api.etherscan.io/api?module=contract&action=getsourcecode&address=" +
    address + "&apikey=" + process.env.ETHERSCAN;
  return new Promise((resolve) => {
    axios.get(url)
      .then(({ data }) => {
        resolve(data);
      })
  })
}

const createOnchainContractIfNotExist = async (files, source) => {
  const dirExist = existsSync(path.resolve("./contracts/mainnet"));
  const keys = Object.keys(source);
  if (!dirExist) {
    mkdirSync(path.resolve("./contracts/mainnet"))
  }
  for (let i = 0; i < files.length; i++) {
    writeFileSync(path.resolve("./contracts/mainnet/" + files[i]), source[keys[i]].content);
  }
  await hre.run("compile");
}

const deleteOnChainContract = async () => {
  const dirExist = existsSync(path.resolve("./contracts/mainnet"));
  if (dirExist) {
    rmdirSync(path.resolve("./contracts/mainnet"), { recursive: true });
  }
}

const upgradeOnChainSafe = async (address, filePath, contractName) => {
  const v1Layout = await getStorageLayoutForContract(hre, filePath + "/" + contractName);
  let onChainSource = await onChainContractInfo(address);
  const onChainContractName = onChainSource.result[0].ContractName;
  onChainSource = onChainSource.result[0].SourceCode;
  onChainSource = onChainSource.slice(1, onChainSource.length - 1);
  const source = JSON.parse(onChainSource).sources;
  let files = Object.keys(source);
  for (let i = 0; i < files.length; i++) {
    files[i] = files[i].split("/");
    files[i] = files[i][files[i].length - 1];
  }
  await createOnchainContractIfNotExist(files, source);
  const onChainLayout = await getStorageLayoutForContract(hre, "contracts/mainnet/" + files[0] + "/" + onChainContractName);
  assertStorageUpgradeSafe(onChainLayout, v1Layout);
  await deleteOnChainContract();
}

const upgradeLocalSafe = async (filePath1, filePath2, contractName1, contractName2) => {
  const defaultLayout = await getStorageLayoutForContract(hre, filePath1 + "/" + contractName1);
  const v1Layout = await getStorageLayoutForContract(hre, filePath2 + "/" + contractName2);
  assertStorageUpgradeSafe(defaultLayout, v1Layout);
}

const storageLayoutTest = async () => {
  const InstaImplementationM1Address = '0x8a3462A50e1a9Fe8c9e7d9023CAcbD9a98D90021'
  const filePaths = ['contracts/v2/accounts/default/implementation_default.sol',
    'contracts/v2/accounts/module1/Implementation_m1.sol'];
  const contractNames = ["InstaDefaultImplementation", "InstaImplementationM1"];

  await upgradeLocalSafe(filePaths[0], filePaths[1], contractNames[0], contractNames[1]);
  await upgradeOnChainSafe(InstaImplementationM1Address, filePaths[1], contractNames[1]);
}

module.exports = {
  upgradeLocalSafe,
  upgradeOnChainSafe,
  storageLayoutTest
};
