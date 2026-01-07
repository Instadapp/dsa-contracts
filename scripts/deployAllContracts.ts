import { BytesLike } from "ethers";
import { network } from "hardhat";
import hre from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const { ethers, networkName, provider } = await network.connect();

const [deployer] = await ethers.getSigners();
const deployerAddress = await deployer.getAddress();

console.log(`Deployer Address: ${deployerAddress}`);

// Get chainId
const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
const chainId = parseInt(chainIdHex, 16);
const deploymentsFile = join(process.cwd(), "docs", `${chainId}_deployments.json`);

console.log(`Chain ID: ${chainId}, Deployments file: ${deploymentsFile}`);

async function loadDeployments(): Promise<Record<string, string>> {
  try {
    const data = await readFile(deploymentsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveDeployment(contractName: string, address: string) {
  const deployments = await loadDeployments();
  deployments[contractName] = address;
  
  // Ensure docs directory exists
  try {
    await mkdir(join(process.cwd(), "docs"), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  await writeFile(deploymentsFile, JSON.stringify(deployments, null, 2), "utf-8");
}

async function instaDeployContract(
  factoryName: string,
  constructorArguments: Array<string | Array<string>>
) {
  // Check if contract is already deployed
  const deployments = await loadDeployments();
  const existingAddress = deployments[factoryName];

  if (existingAddress) {
    // Check if contract has code deployed - try multiple times in case of network issues
    let hasCode = false;
    let code = "0x";
    
    try {
      // Try getting code with a small delay to ensure network is ready
      code = await ethers.provider.getCode(existingAddress);
      // Also try with a block tag to ensure we get the latest
      if (!code || code === "0x" || code.length <= 2) {
        // Retry once more
        await new Promise(resolve => setTimeout(resolve, 100));
        code = await ethers.provider.getCode(existingAddress, "latest");
      }
      
      hasCode = !!(code && code !== "0x" && code.length > 2);
      
      if (hasCode) {
        console.log(`${factoryName} already deployed at ${existingAddress}, reusing...`);
        const contract = await ethers.getContractAt(factoryName, existingAddress);
        return contract;
      } else {
        // Code check failed - might be on different network or contract doesn't exist
        console.log(`${factoryName} address found in deployments (${existingAddress}) but no code found on chain ${chainId}.`);
        console.log(`Code check result: "${code}" (length: ${code?.length || 0})`);
        console.log(`This might mean the address is from a different network or the contract was never deployed. Deploying new contract...`);
      }
    } catch (error) {
      console.log(`${factoryName} address found (${existingAddress}) but error checking code: ${error}`);
      console.log(`Deploying new contract...`);
    }
  } else {
    console.log(`${factoryName} not found in deployments file (${deploymentsFile}), will deploy new contract...`);
  }

  // Deploy new contract
  console.log(`Deploying ${factoryName} to ${networkName} (chain ${chainId})...`);

  const contract = await ethers.deployContract(factoryName, constructorArguments, deployer);

  console.log(`Waiting for the ${factoryName} deployment tx to confirm`);
  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error(`No deployment transaction found for ${factoryName}`);
  }
  
  const receipt = await deploymentTx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Deployment transaction failed for ${factoryName}. Receipt status: ${receipt?.status}`);
  }

  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  
  // Verify the contract actually has code at this address
  const code = await ethers.provider.getCode(deployedAddress);
  if (!code || code === "0x" || code.length <= 2) {
    throw new Error(`Contract ${factoryName} deployed to ${deployedAddress} but no code found! This indicates deployment failed.`);
  }

  console.log(`${factoryName} address:`, deployedAddress);
  console.log(`Deployment confirmed at block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Save deployment address
  await saveDeployment(factoryName, deployedAddress);
  console.log(`Saved ${factoryName} deployment to ${deploymentsFile}`);

  return contract;
}

console.log(`Deploying Contracts to ${networkName}...`);

const instaIndex = await instaDeployContract("InstaIndex", []);
const instaIndexAddress = await instaIndex.getAddress();

const instaList = await instaDeployContract("InstaList", [
  instaIndexAddress,
]);
const instaListAddress = await instaList.getAddress();

const instaAccount = await instaDeployContract("InstaAccount", [
  instaIndexAddress,
]);
const instaAccountAddress = await instaAccount.getAddress();

const instaConnectors = await instaDeployContract("InstaConnectors", [
  instaIndexAddress,
]);
const instaConnectorsAddress = await instaConnectors.getAddress();

const instaEvent = await instaDeployContract("InstaEvent", [
  instaListAddress,
]);
const instaEventAddress = await instaEvent.getAddress();

const instaMemory = await instaDeployContract("InstaMemory", []);
const instaMemoryAddress = await instaMemory.getAddress();

console.log("\n########### setBasics ########");

if (await instaIndex.master() === ethers.ZeroAddress) {
  const setBasicsArgs: [string, string, string, string] = [
    deployerAddress,
    instaListAddress,
    instaAccountAddress,
    instaConnectorsAddress,
  ];
  const tx = await instaIndex.setBasics(...setBasicsArgs);
  console.log("Waiting for the setBasics tx to confirm");
  await tx.wait();
} else {
    if (await instaIndex.master() !== deployerAddress) {
      throw new Error("InstaIndex already has a master set but it's not the deployer address");
    } else {
        console.log("InstaIndex already has a master set and it's the deployer address");
    }
}

console.log("\n########### Verify V1 Contracts ########");

{
    if (await instaIndex.list() !== instaListAddress) {
        throw new Error("InstaIndex already has a list set but it's not the instaListAddress");
    } else {
        console.log("InstaIndex already has a list set and it's the instaListAddress");
    }

    if (await instaIndex.account(1) !== instaAccountAddress) {
        throw new Error("InstaIndex already has a account set but it's not the instaAccountAddress");
    } else {
        console.log("InstaIndex already has a account set and it's the instaAccountAddress");
    }

    if (await instaIndex.connectors(1) !== instaConnectorsAddress) {
        throw new Error("InstaIndex already has a connectors set but it's not the instaConnectorsAddress");
    }
    else {
        console.log("InstaIndex already has a connectors set and it's the instaConnectorsAddress");
    }
}

console.log("\n########### Deploy V2 Contracts ########");

const instaConnectorsV2Impl = await instaDeployContract(
  "InstaConnectorsV2Impl",
  []
);
const instaConnectorsV2ImplAddress = await instaConnectorsV2Impl.getAddress();

const instaConnectorsV2Proxy = await instaDeployContract(
  "InstaConnectorsV2Proxy",
  [
    instaConnectorsV2ImplAddress,
    "0x9800020b610194dBa52CF606E8Aa142F9F256166",
    "0x",
  ]
);
const instaConnectorsV2ProxyAddress = await instaConnectorsV2Proxy.getAddress();

const instaConnectorsV2 = await instaDeployContract("InstaConnectorsV2", [
  instaIndexAddress,
]);
const instaConnectorsV2Address = await instaConnectorsV2.getAddress();

const implementationsMapping = await instaDeployContract(
  "InstaImplementations",
  [instaIndexAddress]
);
const implementationsMappingAddress = await implementationsMapping.getAddress();

const instaAccountV2Proxy = await instaDeployContract("InstaAccountV2", [
  implementationsMappingAddress,
]);
const instaAccountV2ProxyAddress = await instaAccountV2Proxy.getAddress();

const instaAccountV2DefaultImpl = await instaDeployContract(
  "InstaDefaultImplementation",
  [instaIndexAddress]
);
const instaAccountV2DefaultImplAddress = await instaAccountV2DefaultImpl.getAddress();

const instaAccountV2ImplM1 = await instaDeployContract(
  "InstaImplementationM1",
  [instaIndexAddress, instaConnectorsV2Address]
);
const instaAccountV2ImplM1Address = await instaAccountV2ImplM1.getAddress();

console.log("###########");

if (await implementationsMapping.defaultImplementation() === ethers.ZeroAddress) {
  let txSetDefaultImplementation = await implementationsMapping.setDefaultImplementation(
    instaAccountV2DefaultImplAddress
  );
  console.log("Waiting for the setDefaultImplementation tx to confirm");
  await txSetDefaultImplementation.wait();
} else {
    if (await implementationsMapping.defaultImplementation() !== instaAccountV2DefaultImplAddress) {
        throw new Error("ImplementationsMapping already has a default implementation set but it's not the instaAccountV2DefaultImplAddress");
    } else {
        console.log("ImplementationsMapping already has a default implementation set and it's the instaAccountV2DefaultImplAddress");
    }
}   

if (await implementationsMapping.getImplementation(ethers.id("cast(string[],bytes[],address)").slice(0, 10)) === ethers.ZeroAddress) {
  const implementationV1Args: [string, BytesLike[]] = [
    instaAccountV2ImplM1Address,
    ["cast(string[],bytes[],address)"].map((a) =>
      ethers.id(a).slice(0, 10)
    ),
  ];
  const txAddImplementation = await implementationsMapping.addImplementation(
    ...implementationV1Args
  );
  console.log("Waiting for the addImplementation tx to confirm");
  await txAddImplementation.wait();
} else {
    if (await implementationsMapping.getImplementation(ethers.id("cast(string[],bytes[],address)").slice(0, 10)) !== instaAccountV2ImplM1Address) {
        console.log(await implementationsMapping.getImplementation(ethers.id("cast(string[],bytes[],address)").slice(0, 10)));
        console.log(instaAccountV2ImplM1Address);   
        throw new Error("ImplementationsMapping already has the implementation added but it's not the instaAccountV2ImplM1Address");
    } else {
        console.log("ImplementationsMapping already has the implementation added and it's the instaAccountV2ImplM1Address");
    }
}   

if (await instaIndex.account(2) === ethers.ZeroAddress) {
  let txAddNewAccount = await instaIndex.addNewAccount(
    instaAccountV2ProxyAddress,
    instaConnectorsV2ProxyAddress,
    ethers.ZeroAddress
  );
  console.log("Waiting for the addNewAccount tx to confirm");
  await txAddNewAccount.wait();
} else {
    if (await instaIndex.account(2) !== instaAccountV2ProxyAddress) {
        throw new Error("InstaIndex already has the account added but it's not the instaAccountV2ProxyAddress");
    } else {
        console.log("InstaIndex already has the account added and it's the instaAccountV2ProxyAddress");
    }
}

console.log("\n########### Verify V2 Contracts ########");

{
    if (await instaIndex.account(2) !== instaAccountV2ProxyAddress) {
        throw new Error("InstaIndex already has the account added but it's not the instaAccountV2ProxyAddress");
    } else {
        console.log("InstaIndex already has the account added and it's the instaAccountV2ProxyAddress");
    }

    if (await instaIndex.connectors(2) !== instaConnectorsV2ProxyAddress) {
        throw new Error("InstaIndex already has the connectors added but it's not the instaConnectorsV2ProxyAddress");
    } else {
        console.log("InstaIndex already has the connectors added and it's the instaConnectorsV2ProxyAddress");
    }

    if (await implementationsMapping.defaultImplementation() !== instaAccountV2DefaultImplAddress) {
        throw new Error("ImplementationsMapping already has a default implementation set but it's not the instaAccountV2DefaultImplAddress");
    } else {
        console.log("ImplementationsMapping already has a default implementation set and it's the instaAccountV2DefaultImplAddress");
    }

    if (await implementationsMapping.getImplementation(ethers.id("cast(string[],bytes[],address)").slice(0, 10)) !== instaAccountV2ImplM1Address) {
        throw new Error("ImplementationsMapping already has the implementation added but it's not the instaAccountV2ImplM1Address");
    } else {
        console.log("ImplementationsMapping already has the implementation added and it's the instaAccountV2ImplM1Address");
    }
}

if (networkName !== "hardhat") {
  // InstaIndex
  await verifyContract(
    {
      address: instaIndexAddress,
      constructorArgs: [],
    },
    hre
  );

  // InstaList
  await verifyContract(
    {
      address: instaListAddress,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  // InstaAccount
  await verifyContract(
    {
      address: instaAccountAddress,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  // InstaConnectors
  await verifyContract(
    {
      address: instaConnectorsAddress,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  // InstaEvent
  await verifyContract(
    {
      address: instaEventAddress,
      constructorArgs: [instaListAddress],
    },
    hre
  );

  // InstaMemory
  await verifyContract(
    {
      address: instaMemoryAddress,
      constructorArgs: [],
    },
    hre
  );

  // v2
  await verifyContract(
    {
      address: instaConnectorsV2ImplAddress,
      constructorArgs: [],
      contract: "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl",
    },
    hre
  );

  await verifyContract(
    {
      address: instaConnectorsV2ProxyAddress,
      constructorArgs: [
        instaConnectorsV2ImplAddress,
        "0x9800020b610194dBa52CF606E8Aa142F9F256166",
        "0x",
      ],
      contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy",
    },
    hre
  );

  await verifyContract(
    {
      address: instaConnectorsV2Address,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  await verifyContract(
    {
      address: implementationsMappingAddress,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  await verifyContract(
    {
      address: instaAccountV2DefaultImplAddress,
      constructorArgs: [instaIndexAddress],
    },
    hre
  );

  await verifyContract(
    {
      address: instaAccountV2ImplM1Address,
      constructorArgs: [instaIndexAddress, instaConnectorsV2Address],
    },
    hre
  );

  await verifyContract(
    {
      address: instaAccountV2ProxyAddress,
      constructorArgs: [implementationsMappingAddress],
    },
    hre
  );
} else {
  console.log("Contracts deployed to", networkName);
}

console.log("\n########### Deployment Summary ########");
const deploymentSummary = {
  [networkName]: {
    InstaIndex: instaIndexAddress,
    InstaList: instaListAddress,
    versions: {
      v1: {
        InstaAccount: instaAccountAddress,
        InstaConnectors: instaConnectorsAddress,
        InstaEvent: instaEventAddress,
        InstaMemory: instaMemoryAddress,
      },
      v2: {
        InstaConnectorsV2Impl: instaConnectorsV2ImplAddress,
        InstaConnectorsV2Proxy: instaConnectorsV2ProxyAddress,
        InstaConnectorsV2: instaConnectorsV2Address,
        InstaImplementations: implementationsMappingAddress,
        InstaAccountV2: instaAccountV2ProxyAddress,
        InstaDefaultImplementation: instaAccountV2DefaultImplAddress,
        InstaImplementationM1: instaAccountV2ImplM1Address,
      },
    },
  },
};

console.log(JSON.stringify(deploymentSummary, null, 2));
console.log("\nDeployment successful!");

