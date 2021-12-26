import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

import encodeSpells from "../encodeSpells";

module.exports = async function (
  dsaWallet: any,
  userWallet: any,
  toAddAuthAddress: any
) {
  const spells = [
    {
      connector: "auth",
      method: "add",
      args: [toAddAuthAddress],
    },
  ];
  const tx = await dsaWallet
    .connect(userWallet)
    .cast(
      ...encodeSpells(spells),
      "0xA35f3FEFEcb5160327d1B6A210b60D1e1d7968e3"
    );
  return tx;
};
