import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
const { web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle;

import expectEvent from "../scripts/expectEvent";
import instaDeployContract from "../scripts/deployContract";
import abis from "../scripts/constant/abis";

import { Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/dist/types";
import BigNumber from "bignumber.js";

import deployConnector from "../scripts/deployConnector";

import {
  ConnectV2Auth__factory,
  InstaDefaultImplementationV2__factory,
  ConnectV2EmitEvent__factory,
} from "../typechain";
import addresses from "../scripts/constant/addresses";
import encodeSpells from "../scripts/encodeSpells";
import { Contracts } from "@openzeppelin/upgrades";
import deployContracts from "../scripts/deployContracts";
import getMasterSigner from "../scripts/getMasterSigner";

describe("InstaAccount v1", function () {
  let masterSigner: Signer,
    chief1: SignerWithAddress,
    chief2: SignerWithAddress;

  let dsaWallet1: Contract,
    dsaWallet2: Contract,
    dsaWallet3: Contract,
    dsaWallet4: Contract,
    dsaWallet0: Contract,
    dsa1: Signer,
    dsa2: Signer,
    walletv20: any,
    walletv21: any;

  let instaAuthV2: Contract, instaEventV2: Contract;

  let instaIndex: Contract,
    instaList: Contract,
    instaConnectorsV2: Contract,
    implementationsMapping: Contract,
    instaAccountV2Proxy: Contract,
    instaAccountV2ImplM1: Contract,
    instaAccountV2ImplM2: Contract,
    instaAccountV2DefaultImpl: Contract,
    instaAccountV2DefaultImplV2: Contract;

  const addr_zero = ethers.constants.AddressZero;
  const maxValue = ethers.constants.MaxUint256;
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const wallets = provider.getWallets();
  let [wallet0, wallet1, wallet2, wallet3] = wallets;

  //implementations' sigs
  const instaAccountV2DefaultImplSigs = [
    "implementationVersion()",
    "instaIndex()",
    "version()",
    "isAuth(address)",
    "isBeta()",
    "enable",
    "disable",
    "toggleBeta()",
    "onERC721Received(address,address,uint256,bytes)",
    "onERC1155Received(address,address,uint256,uint256,bytes)",
    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  const instaAccountV2DefaultImplV2Sigs = [
    "isAuth(address)",
    "switchShield(bool)",
    "editCheckMapping(address,bool)",
    "enable",
    "disable",
    "shield()",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  const instaAccountV2ImplM1Sigs = [
    "connectorsM1()",
    "cast(string[],bytes[],address)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  const instaAccountV2ImplM2Sigs = [
    "connectorsM2()",
    "castWithFlashloan(string[],bytes[],address)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  before(async () => {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            // @ts-ignore
            jsonRpcUrl: hre.config.networks.hardhat.forking.url,
            blockNumber: 15010000,
          },
        },
      ],
    });
    const deploys = await deployContracts();

    instaConnectorsV2 = deploys.instaConnectorsV2;
    implementationsMapping = deploys.implementationsMapping;
    instaAccountV2Proxy = deploys.instaAccountV2Proxy;
    instaAccountV2DefaultImpl = deploys.instaAccountV2DefaultImpl;
    instaAccountV2ImplM1 = deploys.instaAccountV2ImplM1;
    instaAccountV2ImplM2 = deploys.instaAccountV2ImplM2;

    masterSigner = await getMasterSigner();
    instaAccountV2DefaultImplV2 = await deployContract(
      masterSigner,
      InstaDefaultImplementationV2__factory,
      []
    );

    [chief1, chief2] = await ethers.getSigners();
  });

  async function buildDSAv2(owner: any, abi: any) {
    const tx = await instaIndex.build(owner, 2, owner);
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (a: { event: string }) => a.event === "LogAccountCreated"
    );
    return await ethers.getContractAt(abi, event.args.account);
  }

  it("should have the contracts deployed", async function () {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!implementationsMapping.address).to.be.true;
    expect(!!instaAccountV2DefaultImpl.address).to.be.true;
    expect(!!instaAccountV2DefaultImplV2.address).to.be.true;
    expect(!!instaAccountV2Proxy.address).to.be.true;
    expect(!!instaAccountV2ImplM1.address).to.be.true;
    expect(!!instaAccountV2ImplM2.address).to.be.true;
  });

  it("should add AccountV2 to index registry", async function () {
    let tx = await instaIndex
      .connect(masterSigner)
      .addNewAccount(
        instaAccountV2Proxy.address,
        instaConnectorsV2.address,
        addr_zero
      );
    let txDetails = await tx.wait();

    expect(await instaIndex.account(2)).to.be.equal(
      instaAccountV2Proxy.address
    );
  });

  it("Should build DSAs", async () => {
    //builds DSA and adds wallet0 as auth
    let defaultM1abi = (
      await deployments.getArtifact("InstaDefaultImplementation")
    ).abi;
    let defaultM2abi = await deployments.getArtifact(
      "InstaDefaultImplementationV2"
    );
    let implM1abi = await deployments.getArtifact("InstaImplementationM1");
    let implM2abi = await deployments.getArtifact("InstaImplementationM2");

    dsaWallet1 = await buildDSAv2(wallet0.address, implM1abi);
    expect(!!dsaWallet1.address).to.be.true;
    dsaWallet2 = await buildDSAv2(wallet0.address, implM2abi);
    expect(!!dsaWallet2.address).to.be.true;
    dsaWallet3 = await buildDSAv2(wallet0.address, defaultM1abi);
    expect(!!dsaWallet3.address).to.be.true;
    dsaWallet4 = await buildDSAv2(wallet0.address, defaultM2abi);
    expect(!!dsaWallet4.address).to.be.true;
    dsaWallet0 = await buildDSAv2(
      wallet0.address,
      await deployments.getArtifact("InstaAccountV2")
    );
    expect(!!dsaWallet0.address).to.be.true;

    walletv20 = await ethers.getSigner(dsaWallet1.address);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [walletv20.address],
    });
    dsa1 = ethers.provider.getSigner(walletv20.address);
    walletv21 = await ethers.getSigner(dsaWallet2.address);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [walletv21.address],
    });
    dsa2 = ethers.provider.getSigner(walletv21.address);
  });

  it("Should set balances", async () => {
    await wallet3.sendTransaction({
      to: dsaWallet1.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet3.sendTransaction({
      to: dsaWallet2.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet3.sendTransaction({
      to: dsaWallet3.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet3.sendTransaction({
      to: dsaWallet4.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  describe("Implementations Registry", function () {
    //addImplementation
    //removeImplementation
    //getImplementation
    //getImplementationSigs
    //getSigImplementation
    it("should check instaIndex", async function () {
      expect(await implementationsMapping.instaIndex()).to.be.equal(
        instaIndex.address
      );
      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        addr_zero
      );
    });

    it("should revert setting default implementation via non-master", async function () {
      await expect(
        implementationsMapping
          .connect(wallet0)
          .setDefaultImplementation(instaAccountV2DefaultImpl.address)
      ).to.be.revertedWith("Implementations: not-master");
    });

    it("should revert setting default implementation to zero-address", async function () {
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .setDefaultImplementation(addr_zero)
      ).to.be.revertedWith(
        "Implementations: _defaultImplementation address not valid"
      );
    });

    it("should set default implementation", async function () {
      let tx = await implementationsMapping
        .connect(masterSigner)
        .setDefaultImplementation(instaAccountV2DefaultImpl.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaImplementations")).abi,
        "LogSetDefaultImplementation",
        {
          oldImplementation: addr_zero,
          newImplementation: instaAccountV2DefaultImpl.address,
        }
      );

      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        instaAccountV2DefaultImpl.address
      );
    });

    it("should revert adding same default implementation", async function () {
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .setDefaultImplementation(instaAccountV2DefaultImpl.address)
      ).to.be.revertedWith(
        "Implementations: _defaultImplementation cannot be same"
      );
    });

    it("should revert adding implementation with invalid address", async function () {
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .addImplementation(addr_zero)
      ).to.be.revertedWith("Implementations: _implementation not valid.");
    });

    it("should revert if non-master account adds implementation", async function () {
      await expect(
        implementationsMapping
          .connect(wallet0)
          .addImplementations(instaAccountV2ImplM1.address)
      ).to.be.revertedWith("Implementations: _implementation already added.");
    });

    it("should add ImplementationM1 to mappings", async function () {
      let tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplM1.address,
          instaAccountV2ImplM1Sigs
        );
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaImplementations")).abi,
        "LogAddImplementation",
        {
          implementation: instaAccountV2ImplM1.address,
          sigs: instaAccountV2ImplM1Sigs,
        }
      );
    });

    it("should get the sigs for ImplementationM1", async function () {
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2ImplM1.address
        )
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(instaAccountV2ImplM1Sigs[i]);
      });
    });

    it("should get the implementation address for the sigs", async function () {
      for (let a in instaAccountV2ImplM1Sigs) {
        expect(
          await implementationsMapping.getSigImplementation(a)
        ).to.be.equal(instaAccountV2ImplM1.address);
      }
    });

    it("should give default implementation address", async function () {
      expect(
        await implementationsMapping.getImplementation(
          instaAccountV2DefaultImplSigs[1]
        )
      ).to.be.equal(instaAccountV2DefaultImpl.address);
      expect(
        await implementationsMapping.getImplementation(
          instaAccountV2ImplM1Sigs[1]
        )
      ).to.be.equal(instaAccountV2ImplM1.address);
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2DefaultImplSigs[1]
        )
      ).to.be.equal(addr_zero);
    });

    it("should revert adding implementations with atleast one same function", async function () {
      let test_sigs = ["connectorssM2()", "cast(string[],bytes[],address)"].map(
        (a) => web3.utils.keccak256(a).slice(0, 10)
      );

      await expect(
        implementationsMapping
          .connect(masterSigner)
          .addImplementation(instaAccountV2ImplM2.address, test_sigs)
      ).to.be.revertedWith("Implementations: _sig already added");
    });

    it("should add defaultImplementationM2 to mappings", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2DefaultImplV2.address,
          instaAccountV2DefaultImplV2Sigs
        );
      await tx.wait();

      expectEvent(
        await tx.wait(),
        (await deployments.getArtifact("InstaImplementations")).abi,
        "LogAddImplementation",
        {
          implementation: instaAccountV2DefaultImplV2.address,
          sigs: instaAccountV2DefaultImplV2Sigs,
        }
      );

      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2DefaultImplV2Sigs[0]
        )
      ).to.be.equal(instaAccountV2DefaultImplV2.address);
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2DefaultImplV2.address
        )
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(instaAccountV2DefaultImplV2Sigs[i]);
      });
    });

    it("should revert removing implementation with non-master account", async function () {
      await expect(
        implementationsMapping
          .connect(wallet0)
          .removeImplementation(instaAccountV2DefaultImplV2.address)
      ).to.be.revertedWith("Implementations: not-master");
    });

    it("should revert removing invalid/non-existing implementation", async function () {
      await expect(
        implementationsMapping
          .conenct(masterSigner)
          .removeImplementation(addr_zero)
      ).to.be.revertedWith("Implementations: _implementation not valid.");
      await expect(
        implementationsMapping
          .conenct(masterSigner)
          .removeImplementation(instaAccountV2ImplM2.address)
      ).to.be.revertedWith("Implementations: _implementation not found.");
    });

    it("should remove defaultImplementationM2 from mapping", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .removeImplementation(instaAccountV2DefaultImplV2.address);
      await tx.wait();

      expectEvent(
        await tx.wait(),
        (await deployments.getArtifact("InstaImplementations")).abi,
        "LogRemoveImplementation",
        {
          implementation: instaAccountV2DefaultImplV2.address,
          sigs: instaAccountV2DefaultImplV2Sigs,
        }
      );

      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2DefaultImplV2Sigs[0]
        )
      ).to.be.equal(addr_zero);

      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2DefaultImplV2.address
        )
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(0);
      });
    });

    it("should change default implementation", async function () {
      let tx = await implementationsMapping
        .connect(masterSigner)
        .setDefaultImplementation(instaAccountV2DefaultImplV2.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaImplementations")).abi,
        "LogSetDefaultImplementation",
        {
          oldImplementation: instaAccountV2DefaultImpl.address,
          newImplementation: instaAccountV2DefaultImplV2.address,
        }
      );

      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        instaAccountV2DefaultImplV2.address
      );
    });

    it("should return default implementation v2", async function () {
      expect(
        await implementationsMapping.getImplementation(
          instaAccountV2DefaultImplV2Sigs[1]
        )
      ).to.be.equal(instaAccountV2DefaultImplV2.address);
    });

    after(async () => {
      let tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplM2.address,
          instaAccountV2ImplM2Sigs
        );
      await tx.wait();
      tx = await implementationsMapping
        .connect(masterSigner)
        .setDefaultImplementation(instaAccountV2DefaultImpl.address);
      await tx.wait();
    });
  });

  describe("Connector Registry", async function () {
    let connectorNames = ["authV2", "emitEvent"];
    let authAddr = "0x351Bb32e90C35647Df7a584f3c1a3A0c38F31c68";

    it("should toggle chief", async function () {
      expect(await instaConnectorsV2.instaIndex()).to.be.equal(
        instaIndex.address
      );
      expect(await instaConnectorsV2.chief(chief1.address)).to.be.false;

      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(chief1.address);
      let txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(chief1.address)).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectorsV2")).abi,
        "LogController",
        {
          addr: chief1.address,
          isChief: true,
        }
      );
    });

    it("should revert toggling chief with a chief", async function () {
      expect(await instaConnectorsV2.chief(chief1.address)).to.be.true;
      expect(await instaConnectorsV2.chief(chief2.address)).to.be.false;
      await expect(
        instaConnectorsV2.connect(chief1).toggleChief(chief2.address)
      ).to.be.revertedWith("toggleChief: not-master");
    });

    it("should revert toggling chief with non-master", async function () {
      expect(await instaConnectorsV2.chief(chief2.address)).to.be.false;
      await expect(
        instaConnectorsV2.connect(wallet0).toggleChief(chief2.address)
      ).to.be.revertedWith("toggleChief: not-master");
    });

    it("should set toggle chief2 on-and-off", async function () {
      expect(await instaConnectorsV2.chief(chief2.address)).to.be.false;
      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(chief2.address);
      let txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(chief2.address)).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectorsV2")).abi,
        "LogController",
        {
          addr: chief2.address,
          isChief: true,
        }
      );

      tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(chief2.address);
      txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(chief2.address)).to.be.false;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectorsV2")).abi,
        "LogController",
        {
          addr: chief2.address,
          isChief: false,
        }
      );
    });

    it("should deploy Auth and EmitEvent connectors", async function () {
      await deployConnector({
        connectorName: "authV2",
        contract: "ConnectV2Auth",
        factory: ConnectV2Auth__factory,
      });
      expect(!!addresses.connectors["authV2"]).to.be.true;
      instaAuthV2 = await ethers.getContractAt(
        (
          await deployments.getArtifact("ConnectV2Auth")
        ).abi,
        addresses.connectors["authV2"]
      );

      await deployConnector({
        connectorName: "emitEvent",
        contract: "ConnectV2EmitEvent",
        factory: ConnectV2EmitEvent__factory,
      });
      expect(!!addresses.connectors["emitEvent"]).to.be.true;
      instaEventV2 = await ethers.getContractAt(
        (
          await deployments.getArtifact("ConnectV2EmitEvent")
        ).abi,
        addresses.connectors["emitEvent"]
      );
    });

    it("should revert adding connectors via non-chief or non-master", async function () {
      expect(await instaConnectorsV2.connectors("authV2")).to.be.false;

      await expect(
        instaConnectorsV2
          .connect(wallet2)
          .addConnectors(["authV2"], [instaAuthV2.address])
      ).to.be.revertedWith("not-an-chief");
    });

    it("should revert when name and address length not same", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.false;
      expect(await instaConnectorsV2.connectors("authV2")).to.be.false;

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(["authV2", "emitEvent"], [instaAuthV2.address])
      ).to.be.revertedWith("addConnectors: not same length");
    });

    it("should revert with invalid connector addresses", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.false;
      expect(await instaConnectorsV2.connectors("authV2")).to.be.false;

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(["authV2", "emitEvent"], [addr_zero, addr_zero])
      ).to.be.revertedWith("addConnectors: _connectors address not valid");

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(
            ["authV2", "emitEvent"],
            [instaAuthV2.address, addr_zero]
          )
      ).to.be.revertedWith("addConnectors: _connectors address not valid");
    });

    it("should revert adding same name connectors", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.false;
      expect(await instaConnectorsV2.connectors("authV2")).to.be.false;

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(
            ["authV2", "authV2"],
            [instaAuthV2.address, instaEventV2.address]
          )
      ).to.be.revertedWith("addConnectors: _connectors address not valid");

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(
            ["authV2", "emitEvent"],
            [instaAuthV2.address, addr_zero]
          )
      ).to.be.revertedWith("addConnectors: _connectors address not valid");
    });

    it("should revert removing disabled connectors", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.false;

      await expect(
        instaConnectorsV2.connect(chief1).removeConnectors(["authV2"])
      ).to.be.revertedWith(
        "removeConnectors: _connectorName not added to update"
      );
    });

    it("should add Auth connector", async function () {
      let tx = await instaConnectorsV2
        .connect(chief1)
        .addConnectors(["authV2"], [instaAuthV2.address]);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      let events = txDetails.events;
      expect(events.length).to.be.equal(1);
      expect(events[0].args.connectorNameHash).to.be.equal(
        web3.utils.keccak256("authV2")
      );
      expect(events[0].args.connectorName).to.be.equal("authV2");
      expect(events[0].args.connector).to.be.equal(instaAuthV2.address);
      expect(await instaConnectorsV2.connectors("authV2")).to.be.true;
    });

    it("should revert disabling connectors with non-chief or non-master", async function () {
      expect(await instaConnectorsV2.connectors("authV2")).to.be.true;

      await expect(
        instaConnectorsV2.connect(wallet1).removeConnectors("authV2")
      ).to.be.revertedWith("not-an-chief");
    });

    it("should remove auth connector", async function () {
      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .removeConnectors("authV2");
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      let events = receipt.events;
      expect(events[0].args.connectorNameHash).to.be.equal(
        web3.utils.keccak256("authV2")
      );
      expect(events[0].args.connectorName).to.be.equal("authV2");
      expect(events[0].args.connector).to.be.equal(instaAuthV2.address);
      expect(await instaConnectorsV2.connectors("authV2")).to.be.false;
    });

    it("should add multiple connectors", async function () {
      let address = [instaAuthV2.address, instaEventV2.address];
      let tx = await instaConnectorsV2
        .connect(chief1)
        .addConnectors(connectorNames, address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      txDetails.events.forEach((a: any, i: string | number) => {
        expect(a.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.connectorName).to.be.eq(connectorNames[i]);
        expect(a.connector).to.be.eq(address[i]);
      });
    });

    it("should check connectors enable status", async function () {
      let [ok, address] = await instaConnectorsV2.isConnectors(connectorNames);
      expect(ok).to.be.true;
      address.forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(addresses.connectors[connectorNames[i]]);
      });
    });

    it("should remove multiple connectors", async function () {
      let tx = await instaConnectorsV2
        .connect(chief1)
        .removeConnectors(connectorNames);
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      receipt.events.forEach((a: any, i: string | number) => {
        expect(a.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.connectorName).to.be.eq(connectorNames[i]);
        expect(a.connector).to.be.eq(addresses[i]);
      });

      let [ok] = await instaConnectorsV2.isConnectors(connectorNames);
      expect(ok).to.be.false;

      for (let connector in connectorNames) {
        expect(await instaConnectorsV2.connectors(connector)).to.be.false;
      }
    });

    it("should revert updating not-enabled connectors", async function () {
      await expect(
        instaConnectorsV2
          .connect(chief1)
          .updateConnectors(["authV2"], [authAddr])
      ).to.be.revertedWith(
        "updateConnectors: _connectorName not added to update"
      );
    });

    it("can add same address to multiple connector names", async function () {
      connectorNames.push("authV2-a");
      let connectors = [
        instaAuthV2.address,
        instaEventV2.address,
        instaAuthV2.address,
      ];

      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorNames, connectors);
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      receipt.events.forEach((a: any, i: string | number) => {
        expect(a.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.connectorName).to.be.eq(connectorNames[i]);
        expect(a.connector).to.be.eq(connectors[i]);
      });

      let [ok, address] = await instaConnectorsV2.isConnectors(connectorNames);
      expect(ok).to.be.true;
      address.forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(connectors[i]);
      });
    });

    it("should revert updating connector address to zero address", async function () {
      await expect(
        instaConnectorsV2
          .connect(chief1)
          .updateConnectors(["authV2", "authV2-a"], [addr_zero, addr_zero])
      ).to.be.revertedWith("updateConnectors: _connector address is not valid");

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .updateConnectors(["authV2", "authV2-a"], [authAddr, addr_zero])
      ).to.be.revertedWith("updateConnectors: _connector address is not valid");
    });

    it("should revert with invalid name and address length", async function () {
      await expect(
        instaConnectorsV2
          .connect(chief1)
          .updateConnectors(["authV2", "authV2-a"], [authAddr])
      ).to.be.revertedWith("updateConnectors: not same length");
    });

    it("should update the connector address", async function () {
      let tx = await instaConnectorsV2
        .connect(chief1)
        .updateConnectors(["authV2-a"], [authAddr]);
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      let [ok, connectors] = await instaConnectorsV2.isConnectors(
        connectorNames
      );
      expect(ok).to.be.true;
      connectors.forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(addresses.connectors[connectorNames[i]]);
      });
    });
  });

  describe("Cast spells", function () {
    let spell = [
      {
        connector: "authV2",
        method: "add",
        args: [wallet1.address],
      },
    ];

    it("should revert cast if the msg sender is not auth of DSA", async function () {
      await expect(
        dsaWallet0
          .connect(wallet3)
          .cast(...encodeSpells(spell), wallet0.address)
      ).to.be.revertedWith("1: permission-denied");
    });

    it("should revert if the length of targets is zero", async function () {
      await expect(
        dsaWallet0.connect(wallet0).cast([], [], wallet0.address)
      ).to.be.revertedWith("1: length-invalid");
    });

    it("should revert if length of datas and targets is unequal", async function () {
      let targets = ["authV2"];
      await expect(
        dsaWallet0.connect(wallet0).cast(targets, [], wallet0.address)
      ).to.be.revertedWith("1: array-length-invalid");
    });

    it("it should revert on casting on invalid connectors", async function () {
      expect(await instaConnectorsV2.connectors("authV2-b")).to.be.false;
      spell = [
        {
          connector: "authV2-b",
          method: "add",
          args: [wallet1.address],
        },
      ];
      await expect(
        dsaWallet0
          .connect(wallet0)
          .cast(...encodeSpells(spell), wallet0.address)
      ).to.be.revertedWith("1: not-connector");
    });

    describe("Auth", function () {
      it("should add wallet1 as auth of dsaWallet0 | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet0.connect(wallet0).isAuth(wallet1.address)).to.be
          .false;

        let spells = [
          {
            connector: "authV2",
            method: "add",
            args: [wallet1.address],
          },
        ];
        let tx = await dsaWallet0
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet1.address);
        let receipt = await tx.wait();

        expect(await dsaWallet0.connect(wallet0).isAuth(wallet1.address)).to.be
          .true;
        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogEnableUser",
          {
            user: wallet1.address,
          }
        );
        expectEvent(
          receipt,
          (await deployments.getArtifact("ConnectV2Auth")).abi,
          "LogAddAuth",
          {
            _msgSender: dsaWallet0.address,
            _authority: wallet1.address,
          }
        );
        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaImplementationM1")).abi,
          "LogCast",
          {
            origin: wallet1.address,
            sender: wallet0.address,
            value: "0",
            targetNames: ["authV2"],
            targets: [instaAuthV2.address],
            eventNames: ["LogAddAuth(address,address)"],
            eventParams: [
              ethers.utils.defaultAbiCoder.encode(
                ["address", "address"],
                [wallet0.address, wallet1.address]
              ),
            ],
          }
        );
      });

      it("should remove wallet1 as auth of dsaWallet0 | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet0.connect(wallet0).isAuth(wallet1.address)).to.be
          .true;

        let spells = [
          {
            connector: "authV2",
            method: "remove",
            args: [wallet1.address],
          },
        ];
        let tx = await dsaWallet0
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address);
        let receipt = await tx.wait();

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogDisableUser",
          {
            user: wallet1.address,
          }
        );
        expectEvent(
          receipt,
          (await deployments.getArtifact("ConnectV2Auth")).abi,
          "LogRemoveAuth",
          {
            _msgSender: dsaWallet0.address,
            _authority: wallet1.address,
          }
        );
        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaImplementationM1")).abi,
          "LogCast",
          {
            origin: wallet0.address,
            sender: wallet0.address,
            value: "0",
            targetNames: ["authV2"],
            targets: [instaAuthV2.address],
            eventNames: ["LogRemoveAuth(address,address)"],
            eventParams: [
              ethers.utils.defaultAbiCoder.encode(
                ["address", "address"],
                [wallet0.address, wallet1.address]
              ),
            ],
          }
        );
      });

      it("should revert disabling all auths", async function () {
        let spells = [
          {
            connector: "authV2",
            method: "remove",
            args: [wallet0.address],
          },
        ];
        await expect(
          dsaWallet0
            .connect(wallet0)
            .cast(...encodeSpells(spells), wallet0.address)
        ).to.be.revertedWith("Removing-all-authorities");
      });
    });
  });
});
