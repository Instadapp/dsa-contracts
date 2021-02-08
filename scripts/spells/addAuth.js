const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

const encodeSpells = require("../encodeSpells")

module.exports = async function (dsaWallet, userWallet, toAddAuthAddress) {
  const spells = [{
    connector: "auth",
    method: "add",
    args: [toAddAuthAddress]
  }]
  // console.log("hey", ...encodeSpells(spells))
  const tx = await dsaWallet.connect(userWallet).cast(...encodeSpells(spells), "0xA35f3FEFEcb5160327d1B6A210b60D1e1d7968e3")
  return tx;
};
