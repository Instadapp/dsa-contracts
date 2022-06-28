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
  NFTTest__factory,
} from "../typechain";
import addresses from "../scripts/constant/addresses";
import encodeSpells from "../scripts/encodeSpells";
import { Contracts } from "@openzeppelin/upgrades";
import deployContracts from "../scripts/deployContracts";
import getMasterSigner from "../scripts/getMasterSigner";
import { encode } from "punycode";

describe("InstaAccount V2", function () {
  let masterSigner: Signer,
    chief1: Signer,
    chief2: Signer,
    ichief1: SignerWithAddress,
    ichief2: SignerWithAddress;

  let dsaWallet1: Contract,
    dsaWallet2: Contract,
    dsaWallet3: Contract,
    dsaWallet4: Contract,
    dsaWallet0: Contract,
    dsa1: Signer,
    dsa2: Signer,
    walletv20: any,
    walletv21: any;

  let deployer: SignerWithAddress, signer: SignerWithAddress;
  let masterAddress: Address;
  let setBasicsArgs: any;

  let instaAuthV2: Contract, instaEventV2: Contract;

  let instaIndex: Contract,
    instaList: Contract,
    instaAccount: Contract,
    instaConnectors: Contract,
    instaConnectorsV2: Contract,
    implementationsMapping: Contract,
    instaAccountV2Proxy: Contract,
    instaAccountV2ImplM1: Contract,
    instaAccountV2ImplM2: Contract,
    instaAccountV2ImplM0: Contract,
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
    "receiveEther()",
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
    [deployer, signer, ichief1, ichief2] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    masterAddress = deployerAddress;

    instaIndex = await instaDeployContract("InstaIndex", []);
    instaList = await instaDeployContract("InstaList", [instaIndex.address]);
    instaAccount = await instaDeployContract("InstaAccount", [
      instaIndex.address,
    ]);
    instaConnectors = await instaDeployContract("InstaConnectors", [
      instaIndex.address,
    ]);

    instaConnectorsV2 = await instaDeployContract("InstaConnectorsV2", [
      instaIndex.address,
    ]);
    implementationsMapping = await instaDeployContract("InstaImplementations", [
      instaIndex.address,
    ]);
    instaAccountV2Proxy = await instaDeployContract("InstaAccountV2", [
      implementationsMapping.address,
    ]);
    instaAccountV2DefaultImpl = await instaDeployContract(
      "InstaDefaultImplementation",
      [instaIndex.address]
    );
    instaAccountV2ImplM1 = await instaDeployContract("InstaImplementationM1", [
      instaIndex.address,
      instaConnectorsV2.address,
    ]);
    instaAccountV2ImplM2 = await instaDeployContract("InstaImplementationM2", [
      instaIndex.address,
      instaConnectorsV2.address,
    ]);

    instaAccountV2ImplM0 = await instaDeployContract(
      "InstaImplementationM0Test",
      [instaIndex.address]
    );

    setBasicsArgs = [
      deployerAddress,
      instaList.address,
      instaAccount.address,
      instaConnectors.address,
    ];

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [masterAddress],
    });

    masterSigner = ethers.provider.getSigner(masterAddress);

    instaAccountV2DefaultImplV2 = await instaDeployContract(
      "InstaDefaultImplementationV2",
      []
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ichief1.address],
    });

    chief1 = ethers.provider.getSigner(ichief1.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ichief2.address],
    });

    chief2 = ethers.provider.getSigner(ichief2.address);
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

  it("should set the basics", async function () {
    const tx = await instaIndex.setBasics(...setBasicsArgs);
    const txDetails = await tx.wait();
    expect(!!txDetails.status).to.be.true;
  });

  describe("Account Proxy ", function () {
    it("should revert if no method not found in implementation and no default implementation added", async function () {
      await expect(
        instaIndex
          .connect(masterSigner)
          .addNewAccount(
            instaAccountV2Proxy.address,
            instaConnectorsV2.address,
            addr_zero
          )
      ).to.be.revertedWith("InstaAccountV2: Not able to find _implementation");
    });

    it("should send ether", async function () {
      const txn = await signer.sendTransaction({
        to: instaAccountV2Proxy.address,
        value: ethers.utils.parseEther("2"),
      });
      expect(!!(await txn.wait()).status).to.be.true;
    });
  });

  describe("Implementations Registry", function () {
    it("should check states", async function () {
      expect(await implementationsMapping.instaIndex()).to.be.equal(
        instaIndex.address
      );
      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        addr_zero
      );
      expect(await instaAccountV2Proxy.implementations()).to.be.eq(
        implementationsMapping.address
      );
      expect(await instaAccountV2DefaultImpl.instaIndex()).to.be.eq(
        instaIndex.address
      );
      expect(await instaAccountV2DefaultImpl.isAuth(wallet0.address)).to.be
        .false;
      expect(await instaAccountV2ImplM1.connectorsM1()).to.be.eq(
        instaConnectorsV2.address
      );
    });

    it("should revert setting default implementation via non-master", async function () {
      await expect(
        implementationsMapping
          .connect(signer)
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
          .addImplementation(addr_zero, instaAccountV2ImplM1Sigs)
      ).to.be.revertedWith("Implementations: _implementation not valid.");
    });

    it("should revert if non-master account adds implementation", async function () {
      await expect(
        implementationsMapping
          .connect(signer)
          .addImplementation(
            instaAccountV2ImplM1.address,
            instaAccountV2ImplM1Sigs
          )
      ).to.be.revertedWith("Implementations: not-master");
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

      expect(txDetails.events[0].event).to.be.equal("LogAddImplementation");
      expect(txDetails.events[0].args.implementation).to.be.equal(
        instaAccountV2ImplM1.address
      );
      txDetails.events[0].args.sigs.forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(instaAccountV2ImplM1Sigs[i]);
      });
    });

    it("should revert re-adding ImplementationM1 to mappings", async function () {
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .addImplementation(
            instaAccountV2ImplM1.address,
            instaAccountV2ImplM1Sigs
          )
      ).to.be.revertedWith("Implementations: _implementation already added.");
    });

    it("should get the sigs for ImplementationM1", async function () {
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2ImplM1.address
        )
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(instaAccountV2ImplM1Sigs[i]);
      });
    });

    it("should get the implementation address for the sigs", async function () {
      for (let i = 0; i < implementationsMapping.length; i++) {
        expect(
          await implementationsMapping.getSigImplementation(
            implementationsMapping[i]
          )
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
      let receipt = await tx.wait();

      expect(receipt.events[0].event).to.be.equal("LogAddImplementation");
      expect(receipt.events[0].args.implementation).to.be.equal(
        instaAccountV2DefaultImplV2.address
      );
      receipt.events[0].args.sigs.forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(instaAccountV2DefaultImplV2Sigs[i]);
      });

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

    it("should send ether with method call | AccountProxy: receive()", async function () {
      const txn = await instaAccountV2ImplM0
        .connect(signer)
        .handlePayment(instaAccountV2Proxy.address, {
          value: ethers.utils.parseEther("2"),
        });
      expect(!!(await txn.wait()).status).to.be.true;

      expectEvent(
        await txn.wait(),
        (await deployments.getArtifact("InstaImplementationM0Test")).abi,
        "LogPayEther",
        {
          amt: ethers.utils.parseEther("2"),
        }
      );
    });

    it("should revert removing implementation with non-master account", async function () {
      await expect(
        implementationsMapping
          .connect(signer)
          .removeImplementation(instaAccountV2DefaultImplV2.address)
      ).to.be.revertedWith("Implementations: not-master");
    });

    it("should revert removing invalid/non-existing implementation", async function () {
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .removeImplementation(addr_zero)
      ).to.be.revertedWith("Implementations: _implementation not valid.");
      await expect(
        implementationsMapping
          .connect(masterSigner)
          .removeImplementation(instaAccountV2ImplM2.address)
      ).to.be.revertedWith("Implementations: _implementation not found.");
    });

    it("should remove defaultImplementationM2 from mapping", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .removeImplementation(instaAccountV2DefaultImplV2.address);
      let receipt = await tx.wait();

      expect(receipt.events[0].event).to.be.equal("LogRemoveImplementation");
      expect(receipt.events[0].args.implementation).to.be.equal(
        instaAccountV2DefaultImplV2.address
      );
      receipt.events[0].args.sigs.forEach((a: any, i: string | number) => {
        expect(a).to.be.equal(instaAccountV2DefaultImplV2Sigs[i]);
      });

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

  describe("Setup", function () {
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
      dsaWallet0 = await buildDSAv2(
        wallet0.address,
        (
          await deployments.getArtifact("InstaImplementationM1")
        ).abi
      );
      expect(!!dsaWallet0.address).to.be.true;

      walletv20 = await ethers.getSigner(dsaWallet0.address);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [walletv20.address],
      });
      dsa1 = ethers.provider.getSigner(walletv20.address);

      let defaultM1abi = (
        await deployments.getArtifact("InstaDefaultImplementation")
      ).abi;
      let defaultM2abi = await deployments.getArtifact(
        "InstaDefaultImplementationV2"
      );
      let implM2abi = await deployments.getArtifact("InstaImplementationM2");

      dsaWallet1 = await ethers.getContractAt(defaultM1abi, dsaWallet0.address);
      expect(!!dsaWallet1.address).to.be.true;
      dsaWallet2 = await ethers.getContractAt(
        implM2abi.abi,
        dsaWallet0.address
      );
      expect(!!dsaWallet2.address).to.be.true;
      dsaWallet3 = await ethers.getContractAt(
        defaultM2abi.abi,
        dsaWallet0.address
      );
      expect(!!dsaWallet3.address).to.be.true;

      walletv21 = await ethers.getSigner(dsaWallet2.address);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [walletv21.address],
      });
      dsa2 = ethers.provider.getSigner(walletv21.address);
    });

    it("Should set balances", async () => {
      await wallet3.sendTransaction({
        to: dsaWallet0.address,
        value: ethers.utils.parseEther("10"),
      });
      await wallet3.sendTransaction({
        to: walletv20.address,
        value: ethers.utils.parseEther("10"),
      });

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
    });
  });

  describe("Connector Registry", async function () {
    let connectorNames = ["authV2", "emitEvent"];
    let authAddr = "0x351Bb32e90C35647Df7a584f3c1a3A0c38F31c68";

    it("should toggle chief", async function () {
      expect(await instaConnectorsV2.instaIndex()).to.be.equal(
        instaIndex.address
      );
      expect(await instaConnectorsV2.chief(ichief1.address)).to.be.false;

      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(ichief1.address);
      let txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(ichief1.address)).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectorsV2")).abi,
        "LogController",
        {
          addr: ichief1.address,
          isChief: true,
        }
      );
    });

    it("should revert toggling chief with a chief", async function () {
      expect(await instaConnectorsV2.chief(ichief1.address)).to.be.true;
      expect(await instaConnectorsV2.chief(ichief2.address)).to.be.false;
      console.log(ichief1.address);
      console.log(masterAddress);
      await expect(
        instaConnectorsV2.connect(chief1).toggleChief(ichief2.address)
      ).to.be.revertedWith("toggleChief: not-master");
    });

    it("should revert toggling chief with non-master", async function () {
      expect(await instaConnectorsV2.chief(ichief2.address)).to.be.false;
      await expect(
        instaConnectorsV2.connect(signer).toggleChief(ichief2.address)
      ).to.be.revertedWith("toggleChief: not-master");
    });

    it("should set toggle chief2 on-and-off", async function () {
      expect(await instaConnectorsV2.chief(ichief2.address)).to.be.false;
      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(ichief2.address);
      let txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(ichief2.address)).to.be.true;
      expect(txDetails.events[0].event).to.be.eq("LogController");
      expect(txDetails.events[0].args.addr).to.be.eq(ichief2.address);
      expect(txDetails.events[0].args.isChief).to.be.eq(true);

      tx = await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(ichief2.address);
      txDetails = await tx.wait();

      expect(await instaConnectorsV2.chief(ichief2.address)).to.be.false;
      expect(txDetails.events[0].event).to.be.eq("LogController");
      expect(txDetails.events[0].args.addr).to.be.eq(ichief2.address);
      expect(txDetails.events[0].args.isChief).to.be.eq(false);
    });

    it("should deploy Auth and EmitEvent connectors", async function () {
      await deployConnector(
        {
          connectorName: "authV2",
          contract: "ConnectV2Auth",
          factory: ConnectV2Auth__factory,
        },
        [instaList.address]
      );
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

      await deployConnector(
        {
          connectorName: "authV2-a",
          contract: "ConnectV2Auth",
          factory: ConnectV2Auth__factory,
        },
        [instaList.address]
      );
      expect(!!addresses.connectors["authV2-a"]).to.be.true;
    });

    it("should revert adding connectors via non-chief or non-master", async function () {
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        addr_zero
      );

      await expect(
        instaConnectorsV2
          .connect(signer)
          .addConnectors(["authV2"], [instaAuthV2.address])
      ).to.be.revertedWith("not-an-chief");
    });

    it("should revert when name and address length not same", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.equal(
        addr_zero
      );
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        addr_zero
      );

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(["authV2", "emitEvent"], [instaAuthV2.address])
      ).to.be.revertedWith("addConnectors: not same length");
    });

    it("should revert with invalid connector addresses", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.equal(
        addr_zero
      );
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        addr_zero
      );

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(["authV2", "emitEvent"], [addr_zero, addr_zero])
      ).to.be.revertedWith("addConnectors: _connectors address not vaild");

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(
            ["authV2", "emitEvent"],
            [instaAuthV2.address, addr_zero]
          )
      ).to.be.revertedWith("addConnectors: _connectors address not vaild");
    });

    it("should revert adding same name connectors", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.equal(
        addr_zero
      );
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        addr_zero
      );

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .addConnectors(
            ["authV2", "authV2"],
            [instaAuthV2.address, instaEventV2.address]
          )
      ).to.be.revertedWith("addConnectors: _connectorName added already");
    });

    it("should revert removing disabled connectors", async function () {
      expect(await instaConnectorsV2.connectors("emitEvent")).to.be.equal(
        addr_zero
      );

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
      expect(await instaConnectorsV2.connectors("authV2")).to.be.eq(
        instaAuthV2.address
      );
    });

    it("should revert disabling connectors with non-chief or non-master", async function () {
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        instaAuthV2.address
      );

      await expect(
        instaConnectorsV2.connect(signer).removeConnectors(["authV2"])
      ).to.be.revertedWith("not-an-chief");
    });

    it("should remove auth connector", async function () {
      let tx = await instaConnectorsV2
        .connect(masterSigner)
        .removeConnectors(["authV2"]);
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      let events = receipt.events;
      expect(events[0].args.connectorNameHash).to.be.equal(
        web3.utils.keccak256("authV2")
      );
      expect(events[0].args.connectorName).to.be.equal("authV2");
      expect(events[0].args.connector).to.be.equal(instaAuthV2.address);
      expect(await instaConnectorsV2.connectors("authV2")).to.be.equal(
        addr_zero
      );
    });

    it("should add multiple connectors", async function () {
      let address = [instaAuthV2.address, instaEventV2.address];
      let tx = await instaConnectorsV2
        .connect(chief1)
        .addConnectors(connectorNames, address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      txDetails.events.forEach((a: any, i: string | number) => {
        expect(a.event).to.be.equal("LogConnectorAdded");
        expect(a.args.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.args.connectorName).to.be.eq(connectorNames[i]);
        expect(a.args.connector).to.be.eq(address[i]);
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
      let address = [instaAuthV2.address, instaEventV2.address];
      let tx = await instaConnectorsV2
        .connect(chief1)
        .removeConnectors(connectorNames);
      let receipt = await tx.wait();
      expect(!!receipt.status).to.be.true;

      receipt.events.forEach((a: any, i: string | number) => {
        expect(a.event).to.be.equal("LogConnectorRemoved");
        expect(a.args.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.args.connectorName).to.be.eq(connectorNames[i]);
        expect(a.args.connector).to.be.eq(address[i]);
      });

      let [ok] = await instaConnectorsV2.isConnectors(connectorNames);
      expect(ok).to.be.false;

      for (let connector in connectorNames) {
        expect(await instaConnectorsV2.connectors(connector)).to.be.equal(
          addr_zero
        );
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
      connectorNames = ["authV2", "emitEvent", "authV2-a"];
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
        expect(a.event).to.be.equal("LogConnectorAdded");
        expect(a.args.connectorNameHash).to.be.eq(
          web3.utils.keccak256(connectorNames[i])
        );
        expect(a.args.connectorName).to.be.eq(connectorNames[i]);
        expect(a.args.connector).to.be.eq(connectors[i]);
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
      ).to.be.revertedWith("updateConnectors: _connector address is not vaild");

      await expect(
        instaConnectorsV2
          .connect(chief1)
          .updateConnectors(["authV2", "authV2-a"], [authAddr, addr_zero])
      ).to.be.revertedWith("updateConnectors: _connector address is not vaild");
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
      addresses.connectors["authV2-a"] = authAddr;

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
      let [targets, data] = encodeSpells(spell);
      await expect(
        dsaWallet0.connect(signer).cast(targets, data, wallet0.address)
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
      expect(await instaConnectorsV2.connectors("authV2-b")).to.be.equal(
        addr_zero
      );

      let target = ["authV2-b"];

      spell = [
        {
          connector: "authV2",
          method: "add",
          args: [wallet1.address],
        },
      ];
      let [, data] = encodeSpells(spell);

      await expect(
        dsaWallet0.connect(wallet0).cast(target, data, wallet0.address)
      ).to.be.revertedWith("1: not-connector");
    });

    describe("Auth and EmitEvent connector", function () {
      it("should add wallet1 as auth of dsaWallet0 | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;

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

        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be
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
            _msgSender: wallet0.address,
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
          }
        );

        expect(receipt.events[2].args.targetsNames[0]).to.be.equal("authV2");
        expect(receipt.events[2].args.targets[0]).to.be.equal(
          instaAuthV2.address
        );
        expect(receipt.events[2].args.eventNames[0]).to.be.equal(
          "LogAddAuth(address,address)"
        );
        expect(receipt.events[2].args.eventParams[0]).to.be.equal(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          )
        );
      });

      it("should remove wallet1 as auth of dsaWallet0 | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be
          .true;

        let userLink = await instaList.accountLink(
          await instaList.accountID(dsaWallet0.address)
        );
        expect(userLink.count).to.be.gte(2);
        console.log(userLink.count);

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
            _msgSender: wallet0.address,
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
          }
        );

        expect(receipt.events[2].args.targetsNames[0]).to.be.equal("authV2");
        expect(receipt.events[2].args.targets[0]).to.be.equal(
          instaAuthV2.address
        );
        expect(receipt.events[2].args.eventNames[0]).to.be.equal(
          "LogRemoveAuth(address,address)"
        );
        expect(receipt.events[2].args.eventParams[0]).to.be.equal(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          )
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

      it("should cast multiple spells for same connectors | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be
          .false;
        let spells = [
          {
            connector: "authV2",
            method: "add",
            args: [wallet1.address],
          },
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

        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be
          .false;

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
            _msgSender: wallet0.address,
            _authority: wallet1.address,
          }
        );
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
            _msgSender: wallet0.address,
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
          }
        );
        let targetsNames = ["authV2", "authV2"];
        let targets = [instaAuthV2.address, instaAuthV2.address];
        let eventNames = [
          "LogAddAuth(address,address)",
          "LogRemoveAuth(address,address)",
        ];
        let eventParams = [
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
        ];
        receipt.events[4].args.targetsNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(targetsNames[i]);
          }
        );
        receipt.events[4].args.targets.forEach((a: any, i: string | number) => {
          expect(a).to.be.equal(targets[i]);
        });
        receipt.events[4].args.eventNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventNames[i]);
          }
        );
        receipt.events[4].args.eventParams.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventParams[i]);
          }
        );
      });

      it("should cast multiple spells for different connectors | ImplementationsM1:Cast", async function () {
        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be;
        let spells = [
          {
            connector: "authV2",
            method: "add",
            args: [wallet1.address],
          },
          {
            connector: "emitEvent",
            method: "emitEvent",
            args: [],
          },
        ];
        let tx = await dsaWallet0
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address);
        let receipt = await tx.wait();

        expect(await dsaWallet1.connect(wallet0).isAuth(wallet1.address)).to.be
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
            _msgSender: wallet0.address,
            _authority: wallet1.address,
          }
        );
        expectEvent(
          receipt,
          (await deployments.getArtifact("ConnectV2EmitEvent")).abi,
          "LogEmitEvent",
          {
            dsaAddress: dsaWallet2.address,
            _sender: wallet0.address,
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
          }
        );

        let targetsNames = ["authV2", "emitEvent"];
        let targets = [instaAuthV2.address, instaEventV2.address];
        let eventNames = [
          "LogAddAuth(address,address)",
          "LogEmitEvent(address,address)",
        ];
        let eventParams = [
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [dsaWallet2.address, wallet0.address]
          ),
        ];
        receipt.events[3].args.targetsNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(targetsNames[i]);
          }
        );
        receipt.events[3].args.targets.forEach((a: any, i: string | number) => {
          expect(a).to.be.equal(targets[i]);
        });
        receipt.events[3].args.eventNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventNames[i]);
          }
        );
        receipt.events[3].args.eventParams.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventParams[i]);
          }
        );
      });

      it("should be able to call methods of implementationsM2 | InstaImplementationsM2: CastWithFlashLoan", async function () {
        let spells = [
          {
            connector: "emitEvent",
            method: "emitEvent",
            args: [],
          },
        ];

        let tx = await dsaWallet2
          .connect(wallet0)
          .castWithFlashloan(...encodeSpells(spells), wallet0.address);
        let receipt = await tx.wait();

        expectEvent(
          receipt,
          (await deployments.getArtifact("ConnectV2EmitEvent")).abi,
          "LogEmitEvent",
          {
            dsaAddress: dsaWallet2.address,
            _sender: wallet0.address,
          }
        );

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaImplementationM2")).abi,
          "LogCast",
          {
            origin: wallet0.address,
            sender: wallet0.address,
            value: "0",
          }
        );
        let targetsNames = ["emitEvent"];
        let targets = [instaEventV2.address];
        let eventNames = ["LogEmitEvent(address,address)"];
        let eventParams = [
          ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [dsaWallet2.address, wallet0.address]
          ),
        ];
        receipt.events[1].args.targetsNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(targetsNames[i]);
          }
        );
        receipt.events[1].args.targets.forEach((a: any, i: string | number) => {
          expect(a).to.be.equal(targets[i]);
        });
        receipt.events[1].args.eventNames.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventNames[i]);
          }
        );
        receipt.events[1].args.eventParams.forEach(
          (a: any, i: string | number) => {
            expect(a).to.be.equal(eventParams[i]);
          }
        );
      });
    });

    describe("Default implementation", function () {
      it("should check state", async function () {
        expect(
          await dsaWallet1.connect(wallet0).implementationVersion()
        ).to.be.equal(1);
        expect(await dsaWallet1.connect(wallet0).instaIndex()).to.be.equal(
          instaIndex.address
        );
        expect(await dsaWallet1.connect(wallet0).version()).to.be.equal(2);
      });
      it("should check auth via default implementation", async function () {
        expect(await dsaWallet1.isAuth(wallet0.address)).to.be.true;
        expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;
      });
      it("should revert toggling beta mode from non dsa", async function () {
        await expect(
          dsaWallet1.connect(wallet0).toggleBeta()
        ).to.be.revertedWith("not-self");
      });
      it("should toggle beta mode", async function () {
        expect(await dsaWallet1.isBeta()).to.be.false;
        let tx = await dsaWallet1.connect(dsa1).toggleBeta();
        let receipt = await tx.wait();
        expect(!!receipt.status).to.be.true;

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogBetaMode"
        );
        expect(receipt.events[0].args.beta).to.be.true;
        expect(await dsaWallet1.isBeta()).to.be.true;

        tx = await dsaWallet1.connect(dsa1).toggleBeta();
        receipt = await tx.wait();
        expect(!!receipt.status).to.be.true;

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogBetaMode"
        );
        expect(receipt.events[0].args.beta).to.be.false;
        expect(await dsaWallet1.isBeta()).to.be.false;
      });

      it("should revert enabling wallet2 as auth via non dsa", async function () {
        await expect(
          dsaWallet1.connect(wallet0).enable(wallet2.address)
        ).to.be.revertedWith("not-self");
      });

      it("should revert enabling zero-address as auth", async function () {
        await expect(
          dsaWallet1.connect(dsa1).enable(addr_zero)
        ).to.be.revertedWith("not-valid");
      });

      it("should enable wallet2 as auth via default implementation", async function () {
        let tx = await dsaWallet1.connect(dsa1).enable(wallet2.address);
        let receipt = await tx.wait();
        expect(!!receipt.status).to.be.true;

        expect(await dsaWallet1.isAuth(wallet2.address)).to.be.true;

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogEnableUser",
          {
            user: wallet2.address,
          }
        );
      });

      it("should revert re-enabling enabled auth", async function () {
        await expect(
          dsaWallet1.connect(dsa1).enable(wallet2.address)
        ).to.be.revertedWith("already-enabled");
      });

      it("should revert disabling wallet2 as auth via non dsa", async function () {
        await expect(
          dsaWallet1.connect(wallet0).disable(wallet2.address)
        ).to.be.revertedWith("not-self");
      });

      it("should revert disabling zero-address as auth", async function () {
        await expect(
          dsaWallet1.connect(dsa1).disable(addr_zero)
        ).to.be.revertedWith("not-valid");
      });

      it("should disable wallet2 as auth via default implementation", async function () {
        let tx = await dsaWallet1.connect(dsa1).disable(wallet2.address);
        let receipt = await tx.wait();
        expect(!!receipt.status).to.be.true;

        expect(await dsaWallet1.isAuth(wallet2.address)).to.be.false;

        expectEvent(
          receipt,
          (await deployments.getArtifact("InstaDefaultImplementation")).abi,
          "LogDisableUser",
          {
            user: wallet2.address,
          }
        );
      });

      it("should revert re-disabling disabled auth", async function () {
        await expect(
          dsaWallet1.connect(dsa1).disable(wallet2.address)
        ).to.be.revertedWith("already-disabled");
      });
    });
  });
});
