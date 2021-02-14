const abis = require("./constant/abis");
const addresses = require("./constant/addresses");

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs")


module.exports = function ({ connectorName, address, abi }) {

    addresses.connectors[connectorName] = address
    abis.connectors[connectorName] = abi;

    return { addresses, abis };
};
