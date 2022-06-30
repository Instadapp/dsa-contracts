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
  TokenTest__factory,
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
    instaConnectorsTest: Contract,
    instaConnectorsV2: Contract,
    instaConnectorsV2Test: Contract,
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
    instaConnectorsTest = await instaDeployContract("InstaConnectorsTest", [
      instaIndex.address,
    ]);

    instaConnectorsV2Test = await instaDeployContract("InstaConnectorsV2Test", [
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
      instaConnectorsV2Test.address,
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
      instaConnectorsTest.address,
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
          instaConnectorsV2Test.address,
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
          await deployments.getArtifact("InstaImplementationM0Test")
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

      dsaWallet1 = await ethers.getContractAt(defaultM1abi, dsaWallet0.address);
      expect(!!dsaWallet1.address).to.be.true;

      const tx = await instaIndex.build(wallet1.address, 1, wallet1.address);
      const receipt = await tx.wait();
      const event = receipt.events.find(
        (a: { event: string }) => a.event === "LogAccountCreated"
      );
      dsaWallet2 = await ethers.getContractAt(
        (
          await deployments.getArtifact("InstaAccount")
        ).abi,
        event.args.account
      );
      expect(!!dsaWallet2.address).to.be.true;

      dsaWallet3 = await ethers.getContractAt(
        (
          await deployments.getArtifact("InstaImplementationM1")
        ).abi,
        dsaWallet0.address
      );

      expect(!!dsaWallet3.address).to.be.true;
    });

    it("Should set balances", async () => {
      await wallet3.sendTransaction({
        to: dsaWallet0.address,
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
  });

  describe("Default Implementation ERC tests", function () {
    let nft: Contract;
    it("should deploy ERC721 token and mint", async function () {
      nft = await deployContract(signer, NFTTest__factory, []);
      expect(!!nft.address).to.be.true;
    });

    it("should transfer ERC721 to dsaWallet", async function () {
      let tx = await nft.connect(signer).transferNFT(dsaWallet3.address);
      expect(!!(await tx.wait())).to.be.true;
      expect(await nft.balanceOf(dsaWallet3.address)).to.be.equal("1");

      expectEvent(
        await tx.wait(),
        (await deployments.getArtifact("NFTTest")).abi,
        "LogTransferERC721",
        {
          from: signer.address,
          to: dsaWallet3.address,
          tokenId: "1",
        }
      );
    });

    it("should deploy ERC721 token and mint", async function () {
      nft = await deployContract(signer, TokenTest__factory, []);
      expect(!!nft.address).to.be.true;
    });

    it("should transfer ERC1155 to dsaWallet", async function () {
      let tx = await nft.connect(signer).transfer1155(dsaWallet3.address, 0, 1);
      expect(!!(await tx.wait())).to.be.true;
      expect(await nft.balanceOf(dsaWallet3.address, 0)).to.be.equal("1");

      expectEvent(
        await tx.wait(),
        (await deployments.getArtifact("TokenTest")).abi,
        "LogTransferERC1155",
        {
          from: signer.address,
          to: dsaWallet3.address,
          tokenId: "0",
          amount: "1",
        }
      );
    });

    it("should transfer ERC1155 batch to dsaWallet", async function () {
      let tx = await nft
        .connect(signer)
        .transferBatch1155(
          dsaWallet3.address,
          ["0", "1"],
          ["1", ethers.utils.parseEther("2").toString()]
        );
      expect(!!(await tx.wait())).to.be.true;

      let balance = await nft.balanceOfBatch(
        [dsaWallet3.address, dsaWallet3.address],
        [0, 1]
      );
      expect(balance[0]).to.be.equal("2");
      expect(balance[1]).to.be.equal(
        new BigNumber(2).multipliedBy(1e18).toString()
      );

      expectEvent(
        await tx.wait(),
        (await deployments.getArtifact("TokenTest")).abi,
        "LogTransferBatchERC1155",
        {
          from: signer.address,
          to: dsaWallet3.address,
        }
      );
    });
  });

  describe("Cast", function () {
    it("should revert casting spell for not enabled connector", async function () {
      await expect(
        dsaWallet3.connect(wallet0).cast(["authV2"], ["0x"], wallet0.address)
      ).to.be.revertedWith("target-invalid");

      await expect(
        dsaWallet2.connect(wallet1).cast([addr_zero], ["0x"], wallet1.address)
      ).to.be.revertedWith("target-invalid");
    });
  });
});
