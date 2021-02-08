const abis = require("./constant/abis");
const addresses = require("./constant/addresses");

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs")


module.exports = async function ({connectorName, contract, abi}) {
    const ConnectorInstanace = await ethers.getContractFactory(contract);
    const connectorInstanace = await ConnectorInstanace.deploy();
    await connectorInstanace.deployed();

    addresses.connectors[connectorName] = connectorInstanace.address
    abis.connectors[connectorName] = abi;

    return connectorInstanace;
};
