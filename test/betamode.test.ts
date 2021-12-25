import { expect } from "chai";
import hre from "hardhat";
import deployContracts from "../scripts/deployContracts";
import deployConnector from "../scripts/deployConnector";
import encodeSpells from "../scripts/encodeSpells";
import getMasterSigner from "../scripts/getMasterSigner";
import addresses from "../scripts/constant/addresses";
import {
  InstaDefaultImplementationV2__factory,
  ConnectV2Beta__factory,
} from "../typechain";
const { ethers, web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle;
import type { Signer, Contract } from "ethers";
// import defaultTest2 = require("../artifacts/contracts/v2/accounts/test/implementation_default.v2.test.sol/InstaDefaultImplementationV2.json");

describe("Betamode", function () {
  const address_zero = "0x0000000000000000000000000000000000000000";

  let instaConnectorsV2: Contract,
    implementationsMapping: any,
    instaAccountV2Proxy: any,
    instaAccountV2ImplM1: any,
    instaAccountV2ImplM2: any,
    instaAccountV2DefaultImpl: any,
    instaAccountV2DefaultImplV2: any,
    instaIndex: any,
    instaAccountV2ImplBeta: any;

  const instaAccountV2DefaultImplSigsV2 = [
    "enable(address)",
    "disable(address)",
    "isAuth(address)",
    "switchShield(bool)",
    "shield()",
    "isBeta() returns bool",
    "toogleBeta()",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  const instaAccountV2ImplM1Sigs = ["cast(string[],bytes[],address)"].map((a) =>
    web3.utils.keccak256(a).slice(0, 10)
  );

  const instaAccountV2ImplBetaSigs = [
    "castBeta(string[],bytes[],address)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  let masterSigner: any;

  let acountV2DsaM1Wallet0: any;
  let acountV2DsaDefaultWallet0: any;
  let acountV2DsaBetaWallet0: any;

  const wallets = provider.getWallets();
  let [wallet0] = wallets;
  before(async () => {
    const result = await deployContracts();
    instaAccountV2DefaultImpl = result.instaAccountV2DefaultImpl;
    instaIndex = result.instaIndex;
    instaConnectorsV2 = result.instaConnectorsV2;
    implementationsMapping = result.implementationsMapping;
    instaAccountV2Proxy = result.instaAccountV2Proxy;
    instaAccountV2ImplM1 = result.instaAccountV2ImplM1;
    instaAccountV2ImplM2 = result.instaAccountV2ImplM2;

    const InstaAccountV2ImplBeta = await ethers.getContractFactory(
      "InstaImplementationBetaTest"
    );
    instaAccountV2ImplBeta = await InstaAccountV2ImplBeta.deploy(
      instaIndex.address,
      instaConnectorsV2.address
    );

    masterSigner = await getMasterSigner();

    instaAccountV2DefaultImplV2 = await deployContract(
      masterSigner,
      InstaDefaultImplementationV2__factory,
      []
    );
  });

  it("Should have contracts deployed.", async function () {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!implementationsMapping.address).to.be.true;
    expect(!!instaAccountV2Proxy.address).to.be.true;
    expect(!!instaAccountV2ImplM1.address).to.be.true;
    expect(!!instaAccountV2ImplM2.address).to.be.true;
  });

  describe("Implementations", function () {
    it("Should add default implementation to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .setDefaultImplementation(instaAccountV2DefaultImpl.address);
      await tx.wait();
      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        instaAccountV2DefaultImpl.address
      );
    });

    it("Should add instaAccountV2ImplM1 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplM1.address,
          instaAccountV2ImplM1Sigs
        );
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2ImplM1Sigs[0]
        )
      ).to.be.equal(instaAccountV2ImplM1.address);
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2ImplM1.address
        )
      ).forEach((a: any, i: any) => {
        expect(a).to.be.eq(instaAccountV2ImplM1Sigs[i]);
      });
    });

    it("Should add instaAccountV2ImplBeta sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplBeta.address,
          instaAccountV2ImplBetaSigs
        );
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2ImplBetaSigs[0]
        )
      ).to.be.equal(instaAccountV2ImplBeta.address);
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2ImplBeta.address
        )
      ).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2ImplBetaSigs[i]);
      });
    });

    it("Should add InstaAccountV2 in Index.sol", async function () {
      const tx = await instaIndex
        .connect(masterSigner)
        .addNewAccount(instaAccountV2Proxy.address, address_zero, address_zero);
      await tx.wait();
      expect(await instaIndex.account(2)).to.be.equal(
        instaAccountV2Proxy.address
      );
    });

    it("Should add InstaDefaultImplementationV2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2DefaultImplV2.address,
          instaAccountV2DefaultImplSigsV2
        );
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2DefaultImplSigsV2[0]
        )
      ).to.be.equal(instaAccountV2DefaultImplV2.address);
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2DefaultImplV2.address
        )
      ).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2DefaultImplSigsV2[i]);
      });
    });
  });

  describe("Beta-mode", function () {
    it("Should build DSA v2", async function () {
      const tx = await instaIndex
        .connect(wallet0)
        .build(wallet0.address, 2, wallet0.address);
      const dsaWalletAddress = "0xC13920c134d38408871E7AF5C102894CB5180B92";
      expect((await tx.wait()).events[1].args.account).to.be.equal(
        dsaWalletAddress
      );
      acountV2DsaM1Wallet0 = await ethers.getContractAt(
        "InstaImplementationM1",
        dsaWalletAddress
      );
      acountV2DsaDefaultWallet0 = await ethers.getContractAt(
        "InstaDefaultImplementation",
        dsaWalletAddress
      );
      acountV2DsaBetaWallet0 = await ethers.getContractAt(
        "InstaImplementationBetaTest",
        dsaWalletAddress
      );
    });

    it("Should deploy Beta connector", async function () {
      const connectorName = "betaV2";
      await deployConnector({
        connectorName,
        contract: "ConnectV2Beta",
        factory: ConnectV2Beta__factory,
      });
      expect(!!addresses.connectors["betaV2"]).to.be.true;
      const tx = await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(["betaV2"], [addresses.connectors["betaV2"]]);
      const receipt = await tx.wait();
      const events = receipt.events;
      expect(events[0].args.connectorNameHash).to.be.eq(
        web3.utils.keccak256(connectorName)
      );
      expect(events[0].args.connectorName).to.be.eq(connectorName);
    });

    it("Should enable/disable beta-mode", async function () {
      const spell0 = {
        connector: "betaV2",
        method: "enable",
        args: [],
      };
      const tx0 = await acountV2DsaM1Wallet0
        .connect(wallet0)
        .cast(...encodeSpells([spell0]), wallet0.address);
      const receipt0 = await tx0.wait();

      let enabled = await acountV2DsaDefaultWallet0.connect(wallet0).isBeta();
      expect(enabled).to.equal(true);

      const spell1 = {
        connector: "betaV2",
        method: "disable",
        args: [],
      };
      const tx1 = await acountV2DsaBetaWallet0
        .connect(wallet0)
        .castBeta(...encodeSpells([spell1]), wallet0.address);
      const receipt1 = await tx1.wait();

      enabled = await acountV2DsaDefaultWallet0.connect(wallet0).isBeta();
      expect(enabled).to.equal(false);
    });
  });
});
