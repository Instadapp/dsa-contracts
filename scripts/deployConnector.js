const abis = require("./constant/abis");
const addresses = require("./constant/addresses");

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs")


module.exports = async function ({connectorName, contract, abiPath}) {
    if (fs.existsSync(abiPath)) throw new Error("ABI Path not found.")
    const ConnectorInstanace = await ethers.getContractFactory(contract);
    const connectorInstanace = await ConnectorInstanace.deploy();
    await connectorInstanace.deployed();

    addresses.connectors[connectorName] = connectorInstanace.address
    abis.connectors[connectorName] = require(abiPath).abi;

    return connectorInstanace;
};
