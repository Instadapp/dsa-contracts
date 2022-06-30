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
  ConnectAuth__factory,
  ConnectBasic__factory,
  ConnectV2Auth__factory,
  InstaCheck__factory,
  InstaEvent__factory,
  StaticTest__factory,
} from "../typechain";
import addresses from "../scripts/constant/addresses";
// import encodeSpells from "../scripts/encodeSpells";

describe("InstaAccount v1", function () {
  const addr_zero = ethers.constants.AddressZero;

  let instaIndex: Contract,
    instaList: Contract,
    instaConnectors: Contract,
    instaAccount: Contract,
    instaAuth: Contract,
    instaBasic: Contract,
    instaMemory: Contract,
    instaEvent: Contract;

  let masterSigner: Signer, chief1: Signer, chief2: Signer;
  let dsa1: any;
  let dsa2: any;
  let deployer: SignerWithAddress,
    signer: SignerWithAddress,
    ichief1: SignerWithAddress,
    ichief2: SignerWithAddress;

  const wallets = provider.getWallets();
  let [wallet0, wallet1, wallet2, wallet3] = wallets;
  let setBasicsArgs: [string, string, string, string];
  let masterAddress: Address;
  let dsaWallet1: Contract, dsaWallet2: Contract;
  let walletv1: any, walletv2: any;

  let accounts: any;

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

    console.log(`\tDeployer Address: ${deployerAddress}`);

    instaIndex = await instaDeployContract("InstaIndex", []);
    instaList = await instaDeployContract("InstaList", [instaIndex.address]);
    instaAccount = await instaDeployContract("InstaAccount", [
      instaIndex.address,
    ]);
    instaConnectors = await instaDeployContract("InstaConnectors", [
      instaIndex.address,
    ]);
    instaMemory = await instaDeployContract("InstaMemory", []);

    instaEvent = await instaDeployContract("InstaEvent", [instaList.address]);

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

  function encodeSpells(spells: any[]) {
    const targets = spells.map(
      (a: { connector: any }) => addresses.connectors[a.connector]
    );
    const calldatas = spells.map(
      (a: { method: any; connector: string | number; args: any }) => {
        const functionName = a.method;
        const abi = abis.connectors[a.connector].find((b: { name: any }) => {
          return b.name === functionName;
        });
        if (!abi) throw new Error("Couldn't find function");
        return web3.eth.abi.encodeFunctionCall(abi, a.args);
      }
    );
    return [targets, calldatas];
  }

  it("should have the contracts deployed", async function () {
    expect(!!instaIndex.address).to.be.true;
    expect(!!instaList.address).to.be.true;
    expect(!!instaAccount.address).to.be.true;
    expect(!!instaConnectors.address).to.be.true;
  });

  it("should set the basics", async function () {
    const tx = await instaIndex.setBasics(...setBasicsArgs);
    const txDetails = await tx.wait();
    expect(!!txDetails.status).to.be.true;
  });

  async function getVersionAbi(version: any) {
    if (version === 1)
      return (await deployments.getArtifact("InstaAccount")).abi;
    else
      return (await deployments.getArtifact("InstaDefaultImplementation")).abi;
  }

  async function buildDSA(owner: any, version: any) {
    const tx = await instaIndex.build(owner, version, owner);
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (a: { event: string }) => a.event === "LogAccountCreated"
    );
    return await ethers.getContractAt(
      await getVersionAbi(version),
      event.args.account
    );
  }

  it("Should build DSAs", async () => {
    //builds DSA and adds wallet0 as auth
    dsaWallet1 = await buildDSA(wallet0.address, 1);
    expect(!!dsaWallet1.address).to.be.true;
    dsaWallet2 = await buildDSA(wallet0.address, 1);
    expect(!!dsaWallet2.address).to.be.true;

    walletv1 = await ethers.getSigner(dsaWallet1.address);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [walletv1.address],
    });
    dsa1 = ethers.provider.getSigner(walletv1.address);
    walletv2 = await ethers.getSigner(dsaWallet2.address);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [walletv2.address],
    });
    dsa2 = ethers.provider.getSigner(walletv2.address);
  });

  it("Should set balances", async () => {
    await wallet0.sendTransaction({
      to: dsaWallet1.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet0.sendTransaction({
      to: dsaWallet2.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet0.sendTransaction({
      to: walletv1.address,
      value: ethers.utils.parseEther("10"),
    });
    await wallet0.sendTransaction({
      to: walletv2.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  describe("Insta Memory", async function () {
    let id = 1;
    let byte = web3.utils.keccak256("setBytes");
    let uint = new BigNumber(10).toFixed(0);

    it("should set bytes in instaMemory", async function () {
      let tx = await instaMemory.connect(signer).setBytes(id, byte);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
    });
    it("should get bytes from instaMemory", async function () {
      expect(
        await instaMemory.connect(signer).callStatic.getBytes(id)
      ).to.be.equal(byte);
      let tx = await instaMemory.connect(signer).getBytes(id);
      expect(!!(await tx.wait()).status).to.be.true;
    });
    it("should set uint in instaMemory", async function () {
      id = 2;
      let tx = await instaMemory.connect(signer).setUint(id, uint);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
    });
    it("should get uint from instaMemory", async function () {
      expect(
        await instaMemory.connect(signer).callStatic.getUint(id)
      ).to.be.equal(uint);
      let tx = await instaMemory.connect(signer).getUint(id);
      expect(!!(await tx.wait()).status).to.be.true;
    });
    it("should set address in instaMemory", async function () {
      id = 3;
      let tx = await instaMemory.connect(signer).setAddr(id, wallet3.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
    });
    it("should get address from instaMemory", async function () {
      expect(
        await instaMemory.connect(signer).callStatic.getAddr(id)
      ).to.be.equal(wallet3.address);
      let tx = await instaMemory.connect(signer).getAddr(id);
      expect(!!(await tx.wait()).status).to.be.true;
    });
    it("should not be able to get the addresses,bytes,uint again", async function () {
      expect(
        await instaMemory.connect(signer).callStatic.getAddr(id)
      ).to.be.equal(addr_zero);
      id--;
      expect(
        await instaMemory.connect(signer).callStatic.getUint(id)
      ).to.be.equal(new BigNumber(0).toString());
      id--;
      expect(
        await instaMemory.connect(signer).callStatic.getBytes(id)
      ).to.be.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });
  });

  describe("InstaEvents", function () {
    it("should have InstaEvent deployed", async function () {
      expect(!!instaEvent.address).to.be.true;
    });

    it("should revert calling emitEvent from non-dsa", async function () {
      let eventCode = web3.utils.keccak256("LogRemoveAuth(address,address)");
      let eventData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address"],
        [wallet0.address, wallet3.address]
      );
      await expect(
        instaEvent.connect(signer).emitEvent(1, 1, eventCode, eventData)
      ).to.be.revertedWith("not-SA");
    });
  });

  describe("Insta chiefs", async function () {
    it("should revert on enabling chief with non-master, non-chief account", async function () {
      await expect(
        instaConnectors.connect(signer).enableChief(chief1.getAddress())
      ).to.be.revertedWith("not-an-chief");
    });

    it("should enable chief from master address", async function () {
      let tx = await instaConnectors
        .connect(masterSigner)
        .enableChief(chief1.getAddress());
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogAddController",
        {
          addr: await chief1.getAddress(),
        }
      );
      console.log("\tLogAddController event fired...");
      expect(await instaConnectors.chief(chief1.getAddress())).to.be.true;
    });

    it("should enable chief from other chief address", async function () {
      let tx = await instaConnectors
        .connect(chief1)
        .enableChief(chief2.getAddress());
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogAddController",
        {
          addr: await chief2.getAddress(),
        }
      );
      console.log("\tLogAddController event fired...");
      expect(await instaConnectors.chief(chief2.getAddress())).to.be.true;
    });

    it("should disable chief from master address", async function () {
      let tx = await instaConnectors
        .connect(masterSigner)
        .disableChief(chief2.getAddress());
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogRemoveController",
        {
          addr: await chief2.getAddress(),
        }
      );
      console.log("\tLogRemoveController event fired...");
      expect(await instaConnectors.chief(chief2.getAddress())).to.be.false;
    });

    it("should disable chief from other chief address", async function () {
      let txn = await instaConnectors
        .connect(chief1)
        .enableChief(chief2.getAddress());
      let txnDetails = await txn.wait();
      expect(!!txnDetails.status).to.be.true;

      let tx = await instaConnectors
        .connect(chief1)
        .disableChief(await chief2.getAddress());
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogRemoveController",
        {
          addr: await chief2.getAddress(),
        }
      );
      console.log("\tLogRemoveController event fired...");
      expect(await instaConnectors.chief(chief2.getAddress())).to.be.false;
    });
  });

  describe("Connectors | Deploy, Enable", function () {
    it("should have the connectors deployed", async function () {
      await deployConnector(
        {
          connectorName: "insta-auth",
          contract: "ConnectAuth",
          factory: ConnectAuth__factory,
        },
        [instaEvent.address]
      );
      expect(!!addresses.connectors["insta-auth"]).to.be.true;
      instaAuth = await ethers.getContractAt(
        (
          await deployments.getArtifact("ConnectAuth")
        ).abi,
        addresses.connectors["insta-auth"]
      );

      instaBasic = await deployConnector(
        {
          connectorName: "basic",
          contract: "ConnectBasic",
          factory: ConnectBasic__factory,
        },
        [instaEvent.address, instaMemory.address]
      );
      expect(!!addresses.connectors["basic"]).to.be.true;
      instaBasic = await ethers.getContractAt(
        (
          await deployments.getArtifact("ConnectBasic")
        ).abi,
        addresses.connectors["basic"]
      );
      await deployConnector({
        connectorName: "static-test",
        contract: "StaticTest",
        factory: StaticTest__factory,
      });
      expect(!!addresses.connectors["static-test"]).to.be.true;
    });

    it("should check state of Connectors registry", async function () {
      expect(await instaConnectors.instaIndex()).to.be.equal(
        instaIndex.address
      );
      expect(await instaConnectors.connectors(addresses.connectors["auth"])).to
        .be.false;
      expect(
        await instaConnectors.staticConnectors(addresses.connectors["basic"])
      ).to.be.false;
      expect(await instaConnectors.connectors(addresses.connectors["auth"])).to
        .be.false;
      expect(
        await instaConnectors.staticConnectors(addresses.connectors["basic"])
      ).to.be.false;
      expect(await instaConnectors.chief(chief2.getAddress())).to.be.false;
      expect(await instaConnectors.chief(chief1.getAddress())).to.be.true;
      expect(await instaConnectors.connectorCount()).to.be.equal(
        new BigNumber(0).toString()
      );
      expect(await instaConnectors.connectorLength()).to.be.equal(
        new BigNumber(0).toString()
      );
      expect(await instaConnectors.staticConnectorLength()).to.be.equal(
        new BigNumber(0).toString()
      );
      // let connectorArr = [];
      // expect(await instaConnectors.connectorArray()).to.be.equal(connectorArr);
    });

    it("should revert enabling the connector via non master, non-chief", async function () {
      await expect(
        instaConnectors
          .connect(signer)
          .enable(addresses.connectors["insta-auth"])
      ).to.be.revertedWith("not-an-chief");
    });

    it("should revert enabling zero-address as connector", async function () {
      await expect(
        instaConnectors.connect(masterSigner).enable(addr_zero)
      ).to.be.revertedWith("Not-valid-connector");
    });

    it("should revert enabling incorrect connector: connector id mismatch", async function () {
      let ids = await instaBasic.connectorID();
      expect(ids[0]).to.be.equal(1);
      expect(ids[1]).to.be.equal(2);
      await expect(
        instaConnectors
          .connect(masterSigner)
          .enable(addresses.connectors["basic"])
      ).to.be.revertedWith("ConnectorID-doesnt-match");
    });

    it("should have the connector enabled via master signer", async function () {
      expect(
        await instaConnectors.isConnector([
          addresses.connectors["insta-auth"],
          addresses.connectors["basic"],
        ])
      ).to.be.false;
      expect(
        await instaConnectors.connectors(addresses.connectors["insta-auth"])
      ).to.be.false;

      let ids = await instaAuth.connectorID();
      expect(ids[0]).to.be.equal(1);
      expect(ids[1]).to.be.equal(1);
      let tx = await instaConnectors
        .connect(masterSigner)
        .enable(addresses.connectors["insta-auth"]);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogEnable",
        {
          connector: addresses.connectors["insta-auth"],
        }
      );
      console.log("\tLogEnable event fired...");
    });

    it("should have the state updated", async function () {
      expect(
        await instaConnectors.connectors(addresses.connectors["insta-auth"])
      ).to.be.true;
      expect(await instaConnectors.connectorCount()).to.be.equal(
        new BigNumber(1).toString()
      );
      expect(await instaConnectors.connectorLength()).to.be.equal(
        new BigNumber(1).toString()
      );
      //   expect(await instaConnectors.connectorArray(1)).to.be.equal(addresses.connectors["auth"]);
      expect(
        await instaConnectors.isConnector([
          addresses.connectors["insta-auth"],
          addresses.connectors["basic"],
        ])
      ).to.be.false;
      expect(
        await instaConnectors.isConnector([addresses.connectors["insta-auth"]])
      ).to.be.true;
    });

    it("should have the connector enabled via chief", async function () {
      expect(
        await instaConnectors.isConnector([
          addresses.connectors["insta-auth"],
          addresses.connectors["basic"],
        ])
      ).to.be.false;
      expect(await instaConnectors.connectors(addresses.connectors["basic"])).to
        .be.false;

      let ids = await instaBasic.connectorID();
      expect(ids[0]).to.be.equal(1);
      expect(ids[1]).to.be.equal(2);
      let tx = await instaConnectors
        .connect(chief1)
        .enable(addresses.connectors["basic"]);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogEnable",
        {
          connector: addresses.connectors["basic"],
        }
      );
      console.log("\tLogEnable event fired...");
    });

    it("should have the state updated", async function () {
      expect(await instaConnectors.connectors(addresses.connectors["basic"])).to
        .be.true;
      expect(await instaConnectors.connectorCount()).to.be.equal(
        new BigNumber(2).toString()
      );
      expect(await instaConnectors.connectorLength()).to.be.equal(
        new BigNumber(2).toString()
      );
      //   expect(await instaConnectors.connectorArray(1)).to.be.equal(addresses.connectors["auth"]);
      expect(
        await instaConnectors.isConnector([
          addresses.connectors["insta-auth"],
          addresses.connectors["basic"],
        ])
      ).to.be.true;
      expect(await instaConnectors.isConnector([addresses.connectors["basic"]]))
        .to.be.true;
    });

    it("should revert re-enabling enabled connector", async function () {
      expect(await instaConnectors.connectors(addresses.connectors["basic"])).to
        .be.true;
      await expect(
        instaConnectors
          .connect(masterSigner)
          .enable(addresses.connectors["basic"])
      ).to.be.revertedWith("already-enabled");
    });
  });

  describe("Account | Enable/Disable/Check Auth via Account module", function () {
    it("should check state of DSA", async function () {
      expect(await dsaWallet1.instaIndex()).to.be.equal(instaIndex.address);
      expect(await dsaWallet1.version()).to.be.equal(
        new BigNumber(1).toString()
      );
      expect(await dsaWallet1.shield()).to.be.false;
      expect(await dsaWallet1.isAuth(wallet0.address)).to.be.true;
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;
      expect(await dsaWallet2.instaIndex()).to.be.equal(instaIndex.address);
      expect(await dsaWallet2.version()).to.be.equal(
        new BigNumber(1).toString()
      );
      expect(await dsaWallet2.shield()).to.be.false;
      expect(await dsaWallet2.isAuth(wallet0.address)).to.be.true;
      expect(await dsaWallet2.isAuth(wallet1.address)).to.be.false;
    });

    let userList1: any,
      userLink1: any,
      userList2: any,
      userLink2: any,
      accountLink1: any,
      accountList1: any,
      accountLink2: any,
      accountList2: any,
      dsa1Id: any,
      dsa2Id: any;

    it("should check previous user lists and links", async function () {
      dsa1Id = await instaList.accountID(dsaWallet1.address);
      dsa2Id = await instaList.accountID(dsaWallet2.address);
      userList1 = await instaList.userList(wallet0.address, dsa1Id);
      userList2 = await instaList.userList(wallet0.address, dsa2Id);
      userLink1 = await instaList.userLink(wallet0.address);
      userLink2 = await instaList.userLink(wallet1.address);
      expect(userLink1.first).to.be.equal(dsa1Id);
      expect(userLink1.last).to.be.equal(dsa2Id);
      expect(userLink1.count).to.be.equal(new BigNumber(2).toString());
      expect(userLink2.first).to.be.equal(new BigNumber(0).toString());
      expect(userLink2.last).to.be.equal(new BigNumber(0).toString());
      expect(userLink2.count).to.be.equal(new BigNumber(0).toString());
      expect(userList1.prev).to.be.equal(new BigNumber(0).toString());
      expect(userList1.next).to.be.equal(dsa2Id);
      expect(userList2.prev).to.be.equal(dsa1Id);
      expect(userList2.next).to.be.equal(new BigNumber(0).toString());
    });

    it("should check previous account lists and links", async function () {
      accountList1 = await instaList.accountList(dsa1Id, wallet0.address);
      accountList2 = await instaList.accountList(dsa2Id, wallet0.address);
      accountLink1 = await instaList.accountLink(dsa1Id);
      accountLink2 = await instaList.accountLink(dsa2Id);
      expect(accountLink1.first).to.be.equal(wallet0.address);
      expect(accountLink1.last).to.be.equal(wallet0.address);
      expect(accountLink1.count).to.be.equal(new BigNumber(1).toString());
      expect(accountLink2.first).to.be.equal(wallet0.address);
      expect(accountLink2.last).to.be.equal(wallet0.address);
      expect(accountLink2.count).to.be.equal(new BigNumber(1).toString());
      expect(accountList1.prev).to.be.equal(addr_zero);
      expect(accountList1.next).to.be.equal(addr_zero);
      expect(accountList2.prev).to.be.equal(addr_zero);
      expect(accountList2.next).to.be.equal(addr_zero);
    });

    it("should revert enabling user via non-DSA or non-index sender", async function () {
      await expect(
        dsaWallet1.connect(signer).enable(wallet1.address)
      ).to.be.revertedWith("not-self-index");
      await expect(
        dsaWallet1.connect(masterSigner).enable(wallet1.address)
      ).to.be.revertedWith("not-self-index");
      await expect(
        dsaWallet1.connect(wallet0).enable(wallet1.address)
      ).to.be.revertedWith("not-self-index");
    });

    it("should revert enabling zero address as auth", async function () {
      await expect(
        dsaWallet1.connect(dsa1).enable(addr_zero)
      ).to.be.revertedWith("not-valid");
    });

    it("should enable the EOA as owner via DSA and add auth", async function () {
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;
      let tx = await dsaWallet1.connect(dsa1).enable(wallet1.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogEnable",
        {
          user: wallet1.address,
        }
      );
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;
    });

    it("should have updated user lists and links | list:addUser", async function () {
      userList1 = await instaList.userList(wallet0.address, dsa1Id);
      userList2 = await instaList.userList(wallet0.address, dsa2Id);
      userLink1 = await instaList.userLink(wallet0.address);
      userLink2 = await instaList.userLink(wallet1.address);
      expect(userLink1.first).to.be.equal(dsa1Id);
      expect(userLink1.last).to.be.equal(dsa2Id);
      expect(userLink1.count).to.be.equal(new BigNumber(2).toString());
      expect(userLink2.first).to.be.equal(dsa1Id);
      expect(userLink2.last).to.be.equal(dsa1Id);
      expect(userLink2.count).to.be.equal(new BigNumber(1).toString());
      expect(userList1.prev).to.be.equal(new BigNumber(0).toString());
      expect(userList1.next).to.be.equal(dsa2Id);
      expect(userList2.prev).to.be.equal(dsa1Id);
      expect(userList2.next).to.be.equal(new BigNumber(0).toString());
      userList1 = await instaList.userList(wallet1.address, dsa1Id);
      expect(userList1.prev).to.be.equal(new BigNumber(0).toString());
      expect(userList1.next).to.be.equal(new BigNumber(0).toString());
    });

    it("should have updated account lists and links | list:addUser", async function () {
      accountList1 = await instaList.accountList(dsa1Id, wallet0.address);
      accountList2 = await instaList.accountList(dsa2Id, wallet0.address);
      accountLink1 = await instaList.accountLink(dsa1Id);
      accountLink2 = await instaList.accountLink(dsa2Id);
      expect(accountLink1.first).to.be.equal(wallet0.address);
      expect(accountLink1.last).to.be.equal(wallet1.address);
      expect(accountLink1.count).to.be.equal(new BigNumber(2).toString());
      expect(accountLink2.first).to.be.equal(wallet0.address);
      expect(accountLink2.last).to.be.equal(wallet0.address);
      expect(accountLink2.count).to.be.equal(new BigNumber(1).toString());
      expect(accountList1.prev).to.be.equal(addr_zero);
      expect(accountList1.next).to.be.equal(wallet1.address);
      expect(accountList2.prev).to.be.equal(addr_zero);
      expect(accountList2.next).to.be.equal(addr_zero);
      accountList1 = await instaList.accountList(dsa1Id, wallet1.address);
      expect(accountList1.prev).to.be.equal(wallet0.address);
      expect(accountList1.next).to.be.equal(addr_zero);
    });

    it("should revert re-enabling already auth", async function () {
      await expect(
        dsaWallet1.connect(dsa1).enable(wallet1.address)
      ).to.be.revertedWith("already-enabled");
    });

    it("should revert disabling user via non-DSA", async function () {
      await expect(
        dsaWallet1.connect(signer).disable(wallet1.address)
      ).to.be.revertedWith("not-self");
      await expect(
        dsaWallet1.connect(masterSigner).disable(wallet1.address)
      ).to.be.revertedWith("not-self");
      await expect(
        dsaWallet1.connect(wallet0).disable(wallet1.address)
      ).to.be.revertedWith("not-self");
    });

    it("should revert disabling zero address as auth", async function () {
      await expect(
        dsaWallet1.connect(dsa1).disable(addr_zero)
      ).to.be.revertedWith("not-valid");
    });

    it("should disable the EOA as owner via DSA and remove auth", async function () {
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;
      let tx = await dsaWallet1.connect(dsa1).disable(wallet1.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogDisable",
        {
          user: wallet1.address,
        }
      );
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;
    });

    it("should have updated user lists and links : list:removeUser", async function () {
      dsa1Id = await instaList.accountID(dsaWallet1.address);
      dsa2Id = await instaList.accountID(dsaWallet2.address);
      userList1 = await instaList.userList(wallet0.address, dsa1Id);
      userList2 = await instaList.userList(wallet0.address, dsa2Id);
      userLink1 = await instaList.userLink(wallet0.address);
      userLink2 = await instaList.userLink(wallet1.address);
      expect(userLink1.first).to.be.equal(dsa1Id);
      expect(userLink1.last).to.be.equal(dsa2Id);
      expect(userLink1.count).to.be.equal(new BigNumber(2).toString());
      expect(userLink2.first).to.be.equal(new BigNumber(0).toString());
      expect(userLink2.last).to.be.equal(new BigNumber(0).toString());
      expect(userLink2.count).to.be.equal(new BigNumber(0).toString());
      expect(userList1.prev).to.be.equal(new BigNumber(0).toString());
      expect(userList1.next).to.be.equal(dsa2Id);
      expect(userList2.prev).to.be.equal(dsa1Id);
      expect(userList2.next).to.be.equal(new BigNumber(0).toString());
      userList1 = await instaList.userList(wallet1.address, dsa1Id);
      expect(userList1.prev).to.be.equal(new BigNumber(0).toString());
      expect(userList1.next).to.be.equal(new BigNumber(0).toString());
    });

    it("should have updated account lists and links | list:removeAccount", async function () {
      accountList1 = await instaList.accountList(dsa1Id, wallet0.address);
      accountList2 = await instaList.accountList(dsa2Id, wallet0.address);
      accountLink1 = await instaList.accountLink(dsa1Id);
      accountLink2 = await instaList.accountLink(dsa2Id);
      expect(accountLink1.first).to.be.equal(wallet0.address);
      expect(accountLink1.last).to.be.equal(wallet0.address);
      expect(accountLink1.count).to.be.equal(new BigNumber(1).toString());
      expect(accountLink2.first).to.be.equal(wallet0.address);
      expect(accountLink2.last).to.be.equal(wallet0.address);
      expect(accountLink2.count).to.be.equal(new BigNumber(1).toString());
      expect(accountList1.prev).to.be.equal(addr_zero);
      expect(accountList1.next).to.be.equal(addr_zero);
      expect(accountList2.prev).to.be.equal(addr_zero);
      expect(accountList2.next).to.be.equal(addr_zero);
      accountList1 = await instaList.accountList(dsa1Id, wallet1.address);
      expect(accountList1.prev).to.be.equal(addr_zero);
      expect(accountList1.next).to.be.equal(addr_zero);
    });

    it("should revert re-disabling already non-auth", async function () {
      await expect(
        dsaWallet1.connect(dsa1).disable(wallet1.address)
      ).to.be.revertedWith("already-disabled");
    });
  });

  describe("Account | Cast spells", function () {
    let userLink: any;
    let usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    let ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let maxValue = ethers.constants.MaxUint256;
    const abi = abis.basic.erc20;
    const usdcContract = new ethers.Contract(usdcAddr, abi, provider);
    let whale = "0xCFFAd3200574698b78f32232aa9D63eABD290703";

    it("should revert calling cast on DSA fron non-owner address", async function () {
      expect(await dsaWallet1.isAuth(signer.address)).to.be.false;

      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet1.address],
        },
      ];
      await expect(
        dsaWallet1
          .connect(signer)
          .cast(...encodeSpells(spells), wallet0.address)
      ).to.be.revertedWith("permission-denied");
    });

    it("should revert casting spells with insufficient data or targets", async function () {
      expect(await dsaWallet1.isAuth(wallet0.address)).to.be.true;
      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet1.address],
        },
      ];

      let [targets, datas] = encodeSpells(spells);
      expect(targets.length).to.be.gte(1);

      await expect(
        dsaWallet1.connect(wallet0).cast(targets, [], wallet0.address)
      ).to.be.revertedWith("array-length-invalid");
    });

    it("should revert casting spells on zero-address connectors", async function () {
      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet1.address],
        },
      ];

      let [targets, datas] = encodeSpells(spells);
      expect(targets.length).to.be.gte(1);

      await expect(
        dsaWallet1.connect(wallet0).cast([addr_zero], datas, wallet0.address)
      ).to.be.revertedWith("not-connector");
    });

    it("should revert on casting spells with not-enabled connector", async function () {
      expect(await dsaWallet1.isAuth(wallet0.address)).to.be.true;
      await deployConnector(
        {
          connectorName: "auth",
          contract: "ConnectV2Auth",
          factory: ConnectV2Auth__factory,
        },
        [instaList.address]
      );
      expect(!!addresses.connectors["auth"]).to.be.true;
      expect(await instaConnectors.isConnector([addresses.connectors["auth"]]))
        .to.be.false;
      const spells = [
        {
          connector: "auth",
          method: "add",
          args: [wallet1.address],
        },
      ];

      await expect(
        dsaWallet1
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address)
      ).to.be.revertedWith("not-connector");
    });

    it("should add wallet1 as auth using spells for Auth connector on dsaWallet1", async function () {
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;
      expect(await dsaWallet1.isAuth(wallet0.address)).to.be.true;
      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet1.address],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogEnable",
        {
          user: wallet1.address,
        }
      );
      console.log("\tAccount:LogEnable event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectAuth")).abi,
        "LogAddAuth",
        { _msgSender: wallet0.address, _auth: wallet1.address }
      );
      console.log("\tAuth:LogAddAuth event fired...");

      let [type, id] = await instaAuth.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256("LogAddAuth(address,address)"),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;
    });

    it("should check state of list resgistry", async function () {
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;

      let dsa1Id = await instaList.accountID(dsaWallet1.address);
      userLink = await instaList.userLink(wallet1.address);
      let accountList = await instaList.accountList(dsa1Id, wallet0.address);
      let accountLink = await instaList.accountLink(dsa1Id);

      expect(userLink.first).to.be.equal(dsa1Id);
      expect(userLink.last).to.be.equal(dsa1Id);
      expect(userLink.count).to.be.equal(new BigNumber(1).toString());
      expect(accountList.next).to.be.equal(wallet1.address);
      accountList = await instaList.accountList(dsa1Id, wallet1.address);
      expect(accountList.prev).to.be.equal(wallet0.address);
      expect(accountLink.first).to.be.equal(wallet0.address);
      expect(accountLink.last).to.be.equal(wallet1.address);
      expect(accountLink.count).to.be.equal(new BigNumber(2).toString());
    });

    it("should be able to cast multiple spells for different connectors", async function () {
      let balance_before = (
        await ethers.provider.getBalance(dsaWallet1.address)
      ).toString();

      const spells = [
        {
          connector: "insta-auth",
          method: "removeModule",
          args: [wallet1.address],
        },
        {
          connector: "basic",
          method: "deposit",
          args: [ethAddr, ethers.utils.parseEther("5"), 0, 0],
        },
      ];

      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address, {
          value: ethers.utils.parseEther("5"),
        });
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogDisable",
        {
          user: wallet1.address,
        }
      );
      console.log("\tAccount:LogDisable event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectAuth")).abi,
        "LogRemoveAuth",
        { _msgSender: wallet0.address, _auth: wallet1.address }
      );
      console.log("\tAuth:LogRemoveAuth event fired...");

      let [type, id] = await instaAuth.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256("LogRemoveAuth(address,address)"),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");
      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.false;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectBasic")).abi,
        "LogDeposit",
        {
          erc20: ethAddr,
          tokenAmt: ethers.utils.parseEther("5"),
          getId: "0",
          setId: "0",
        }
      );
      console.log("\tBasic:LogDepositEvent event fired...");

      // expectEvent(
      //   txDetails,
      //   (await deployments.getArtifact("InstaEvent")).abi,
      //   "LogEvent",
      //   {
      //     connectorType: "1",
      //     connectorID: "1",
      //     accountID: await instaList.accountID(dsaWallet1.address),
      //     eventCode: web3.utils.keccak256(
      //       "LogDeposit(address,uint256,uint256,uint256)"
      //     ),
      //     eventData: ethers.utils.defaultAbiCoder.encode(
      //       ["address", "uint256", "uint256", "uint256"],
      //       [ethAddr, ethers.utils.parseEther("5"), 0, 0]
      //     ),
      //   }
      // );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("5"),
        }
      );
      console.log("\tLogCast event fired...");

      expect(await ethers.provider.getBalance(dsaWallet1.address)).to.be.gte(
        new BigNumber(balance_before)
          .plus(new BigNumber(5).multipliedBy(1e18))
          .toString()
      );
    });

    it("should revert passing invalid value on depositing ether", async function () {
      const spells = [
        {
          connector: "basic",
          method: "deposit",
          args: [ethAddr, ethers.utils.parseEther("2"), 0, 0],
        },
      ];
      await expect(
        dsaWallet1
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address, {
            value: ethers.utils.parseEther("1"),
          })
      ).to.be.revertedWith("invalid-ether-amount");
    });

    it("should revert on withdrawing to non-auth address using basic connector", async function () {
      const spells = [
        {
          connector: "basic",
          method: "withdraw",
          args: [ethAddr, ethers.utils.parseEther("5"), wallet1.address, 0, 0],
        },
      ];
      await expect(
        dsaWallet1
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address, {
            value: ethers.utils.parseEther("5"),
          })
      ).to.be.revertedWith("invalid-to-address");
    });

    it("should add wallet1 as auth", async function () {
      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet1.address],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogEnable",
        {
          user: wallet1.address,
        }
      );
      console.log("\tAccount:LogEnable event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectAuth")).abi,
        "LogAddAuth",
        { _msgSender: wallet0.address, _auth: wallet1.address }
      );
      console.log("\tAuth:LogAddAuth event fired...");

      let [type, id] = await instaAuth.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256("LogAddAuth(address,address)"),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet1.address]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");

      expect(await dsaWallet1.isAuth(wallet1.address)).to.be.true;
    });

    it("should be able to cast multiple spells for same connector", async function () {
      console.log(
        (await usdcContract.connect(signer).balanceOf(whale)).toString()
      );

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whale],
      });

      let signer1 = await ethers.getSigner(whale);
      await usdcContract
        .connect(signer1)
        .transfer(wallet0.address, ethers.utils.parseUnits("10", 6));

      let bal = (
        await usdcContract.connect(signer).balanceOf(wallet0.address)
      ).toString();

      let txn = await usdcContract
        .connect(wallet0)
        .approve(dsaWallet1.address, maxValue);
      await txn.wait();

      const spells = [
        {
          connector: "basic",
          method: "withdraw",
          args: [ethAddr, ethers.utils.parseEther("5"), wallet1.address, 0, 0],
        },
        {
          connector: "basic",
          method: "deposit",
          args: [usdcAddr, maxValue, 0, 1],
        },
        {
          connector: "basic",
          method: "withdraw",
          args: [usdcAddr, maxValue, wallet0.address, 1, 0],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      let [type, id] = await instaBasic.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectBasic")).abi,
        "LogWithdraw",
        {
          erc20: ethAddr,
          tokenAmt: ethers.utils.parseEther("5"),
          to: wallet1.address,
          getId: "0",
          setId: "0",
        }
      );
      console.log("\tBasic:LogWithdrawEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256(
            "LogWithdraw(address,uint256,address,uint256,uint256)"
          ),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "address", "uint256", "uint256"],
            [ethAddr, ethers.utils.parseEther("5"), wallet1.address, 0, 0]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectBasic")).abi,
        "LogDeposit",
        {
          erc20: usdcAddr,
          tokenAmt: bal,
          getId: "0",
          setId: "1",
        }
      );
      console.log("\tBasic:LogDepositEvent event fired...");

      // expectEvent(
      //   txDetails,
      //   (await deployments.getArtifact("InstaEvent")).abi,
      //   "LogEvent",
      //   {
      //     connectorType: type,
      //     connectorID: id,
      //     accountID: await instaList.accountID(dsaWallet1.address),
      //     eventCode: web3.utils.keccak256(
      //       "LogDeposit(address,uint256,uint256,uint256)"
      //     ),
      //     eventData: ethers.utils.defaultAbiCoder.encode(
      //       ["address", "uint256", "uint256", "uint256"],
      //       [usdcAddr, bal, 0, 1]
      //     ),
      //   }
      // );
      // console.log("\tInstaEvent:LogEvent event fired...");

      // expectEvent(
      //   txDetails,
      //   (await deployments.getArtifact("ConnectBasic")).abi,
      //   "LogWithdraw",
      //   {
      //     erc20: usdcAddr,
      //     tokenAmt: bal,
      //     to: wallet0.address,
      //     getId: "1",
      //     setId: "0",
      //   }
      // );
      // console.log("\tBasic:LogWithdrawEvent event fired...");

      // expectEvent(
      //   txDetails,
      //   (await deployments.getArtifact("InstaEvent")).abi,
      //   "LogEvent",
      //   {
      //     connectorType: type,
      //     connectorID: id,
      //     accountID: await instaList.accountID(dsaWallet1.address),
      //     eventCode: web3.utils.keccak256(
      //       "LogWithdraw(address,uint256,address,uint256,uint256)"
      //     ),
      //     eventData: ethers.utils.defaultAbiCoder.encode(
      //       ["address", "uint256", "address", "uint256", "uint256"],
      //       [ethAddr, ethers.utils.parseEther("10"), wallet0.address, 0, 0]
      //     ),
      //   }
      // );
      // console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");
    });

    it("should deposit and check event", async function () {
      let txn = await usdcContract
        .connect(wallet0)
        .approve(dsaWallet1.address, maxValue);
      await txn.wait();
      const spells = [
        {
          connector: "basic",
          method: "deposit",
          args: [usdcAddr, ethers.utils.parseUnits("8", 6), 0, 0],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      let [type, id] = await instaBasic.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectBasic")).abi,
        "LogDeposit",
        {
          erc20: usdcAddr,
          tokenAmt: ethers.utils.parseUnits("8", 6),
          getId: "0",
          setId: "0",
        }
      );
      console.log("\tBasic:LogDepositEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256(
            "LogDeposit(address,uint256,uint256,uint256)"
          ),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "uint256", "uint256"],
            [usdcAddr, ethers.utils.parseUnits("8", 6), 0, 0]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");
    });
  });

  describe("Static connectors and shield", async function () {
    it("should revert enabling static connector via non-chief or non-master", async function () {
      await expect(
        instaConnectors
          .connect(signer)
          .enableStatic(addresses.connectors["insta-auth"])
      ).to.be.revertedWith("not-an-chief");
    });
    it("should enable Auth connector as static connector", async function () {
      expect(
        await instaConnectors.connectors(addresses.connectors["insta-auth"])
      ).to.be.true;
      expect(
        await instaConnectors.staticConnectors(
          addresses.connectors["insta-auth"]
        )
      ).to.be.false;
      let tx = await instaConnectors
        .connect(chief1)
        .enableStatic(addresses.connectors["insta-auth"]);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaConnectors")).abi,
        "LogEnableStatic",
        {
          connector: addresses.connectors["insta-auth"],
        }
      );
      console.log("\tLogEnableStatic event fired...");

      expect(
        await instaConnectors.isStaticConnector([
          addresses.connectors["insta-auth"],
        ])
      ).to.be.true;
      expect(
        await instaConnectors.staticConnectors(
          addresses.connectors["insta-auth"]
        )
      ).to.be.true;
      expect(await instaConnectors.staticConnectorLength()).to.be.equal(
        new BigNumber(1).toString()
      );
    });

    it("should revert re-enabling already enabled static connector", async function () {
      await expect(
        instaConnectors
          .connect(masterSigner)
          .enableStatic(addresses.connectors["insta-auth"])
      ).to.be.revertedWith("already-enabled");
    });

    it("should revert enabling zero-address as static connector", async function () {
      await expect(
        instaConnectors.connect(masterSigner).enableStatic(addr_zero)
      ).to.be.revertedWith("Not-valid-connector");
    });

    it("should revert enabling incorrect-version as static connector", async function () {
      await expect(
        instaConnectors
          .connect(masterSigner)
          .enableStatic(addresses.connectors["static-test"])
      ).to.be.revertedWith("ConnectorID-doesnt-match");
    });

    it("should cast on non-static auth connector(shield-off)", async function () {
      expect(await dsaWallet1.shield()).to.be.false;
      const spells = [
        {
          connector: "insta-auth",
          method: "addModule",
          args: [wallet3.address],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogEnable",
        {
          user: wallet3.address,
        }
      );
      console.log("\tAccount:LogEnable event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectAuth")).abi,
        "LogAddAuth",
        { _msgSender: wallet0.address, _auth: wallet3.address }
      );
      console.log("\tAuth:LogAddAuth event fired...");

      let [type, id] = await instaAuth.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256("LogAddAuth(address,address)"),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet3.address]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");
      expect(await dsaWallet1.isAuth(wallet3.address)).to.be.true;
    });

    describe("Check module", async function () {
      let instaCheck: Contract;
      it("should deploy add check module to index", async function () {
        instaCheck = await instaDeployContract("InstaCheck", []);
        let tx = await instaIndex
          .connect(masterSigner)
          .changeCheck(1, instaCheck.address);
        expect(!!(await tx.wait()).status).to.be.true;
      });

      it("should revert cast when target connector fails check", async function () {
        await instaCheck.connect(signer).change(false);
        expect(await instaIndex.check(1)).to.be.equal(instaCheck.address);
        expect(await instaCheck.isOk()).to.be.false;
        let tx = await dsaWallet1.connect(wallet0).switchShield(false);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        expect(await dsaWallet1.shield()).to.be.false;

        const spells = [
          {
            connector: "insta-auth",
            method: "addModule",
            args: [wallet2.address],
          },
        ];
        await expect(
          dsaWallet1
            .connect(wallet0)
            .cast(...encodeSpells(spells), wallet0.address)
        ).to.be.revertedWith("not-ok");
      });

      it("should check connector's 'ok' and cast", async function () {
        await instaCheck.connect(signer).change(true);
        const spells = [
          {
            connector: "insta-auth",
            method: "addModule",
            args: [wallet2.address],
          },
        ];
        let tx = await dsaWallet1
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address);
        let txDetails = await tx.wait();

        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaAccount")).abi,
          "LogEnable",
          {
            user: wallet2.address,
          }
        );
        console.log("\tAccount:LogEnable event fired...");

        expectEvent(
          txDetails,
          (await deployments.getArtifact("ConnectAuth")).abi,
          "LogAddAuth",
          { _msgSender: wallet0.address, _auth: wallet2.address }
        );
        console.log("\tAuth:LogAddAuth event fired...");

        let [type, id] = await instaAuth.connectorID();
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaEvent")).abi,
          "LogEvent",
          {
            connectorType: type,
            connectorID: id,
            accountID: await instaList.accountID(dsaWallet1.address),
            eventCode: web3.utils.keccak256("LogAddAuth(address,address)"),
            eventData: ethers.utils.defaultAbiCoder.encode(
              ["address", "address"],
              [wallet0.address, wallet2.address]
            ),
          }
        );
        console.log("\tInstaEvent:LogEvent event fired...");

        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaAccount")).abi,
          "LogCast",
          {
            origin: wallet0.address,
            sender: wallet0.address,
            value: ethers.utils.parseEther("0"),
          }
        );
        console.log("\tLogCast event fired...");

        expect(await dsaWallet1.isAuth(wallet2.address)).to.be.true;
      });
    });

    it("should toggle shield (false --> true)", async function () {
      expect(await dsaWallet1.shield()).to.be.false;
      let tx = await dsaWallet1.connect(wallet0).switchShield(true);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogSwitchShield",
        { _shield: true }
      );
      console.log("\tLogSwitchShield event fired...");

      expect(await dsaWallet1.shield()).to.be.true;
    });

    it("should revert re-switching shield to already set value", async function () {
      await expect(
        dsaWallet1.connect(wallet0).switchShield(true)
      ).to.be.revertedWith("shield is set");
    });

    it("should revert switching shield with not owner", async function () {
      await expect(
        dsaWallet2.connect(wallet1).switchShield(true)
      ).to.be.revertedWith("not-self");
    });

    it("should cast on static auth connector(shield-on)", async function () {
      expect(await dsaWallet1.shield()).to.be.true;
      const spells = [
        {
          connector: "insta-auth",
          method: "removeModule",
          args: [wallet3.address],
        },
      ];
      let tx = await dsaWallet1
        .connect(wallet0)
        .cast(...encodeSpells(spells), wallet0.address);
      let txDetails = await tx.wait();

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogDisable",
        {
          user: wallet3.address,
        }
      );
      console.log("\tAccount:LogDisable event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("ConnectAuth")).abi,
        "LogRemoveAuth",
        { _msgSender: wallet0.address, _auth: wallet3.address }
      );
      console.log("\tAuth:LogRemoveAuth event fired...");

      let [type, id] = await instaAuth.connectorID();
      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaEvent")).abi,
        "LogEvent",
        {
          connectorType: type,
          connectorID: id,
          accountID: await instaList.accountID(dsaWallet1.address),
          eventCode: web3.utils.keccak256("LogRemoveAuth(address,address)"),
          eventData: ethers.utils.defaultAbiCoder.encode(
            ["address", "address"],
            [wallet0.address, wallet3.address]
          ),
        }
      );
      console.log("\tInstaEvent:LogEvent event fired...");

      expectEvent(
        txDetails,
        (await deployments.getArtifact("InstaAccount")).abi,
        "LogCast",
        {
          origin: wallet0.address,
          sender: wallet0.address,
          value: ethers.utils.parseEther("0"),
        }
      );
      console.log("\tLogCast event fired...");
      expect(await dsaWallet1.isAuth(wallet3.address)).to.be.false;
    });

    it("should revert on casting spells for non-static connector with shield on", async function () {
      let ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      let spells = [
        {
          connector: "basic",
          method: "withdraw",
          args: [ethAddr, ethers.utils.parseEther("5"), wallet1.address, 0, 0],
        },
      ];
      await expect(
        dsaWallet1
          .connect(wallet0)
          .cast(...encodeSpells(spells), wallet0.address)
      ).to.be.revertedWith("not-static-connector");
    });
  });

  describe("should disable connector", function () {
    it("should revert disabling the connector via non-chief", async function () {
      await expect(
        instaConnectors
          .connect(signer)
          .disable(addresses.connectors["insta-auth"])
      ).to.be.revertedWith("not-an-chief");
    });
    it("should disable auth connector", async function () {
      let tx = await instaConnectors
        .connect(masterSigner)
        .disable(instaAuth.address);
      let txDetails = await tx.wait();
      expect(!!txDetails.status).to.be.true;
      expect(await instaConnectors.connectors(instaAuth.address)).to.be.false;
      expect(await instaConnectors.isConnector([instaAuth.address])).to.be
        .false;
    });
    it("should revert disabling disabled connector", async function () {
      await expect(
        instaConnectors.connect(masterSigner).disable(instaAuth.address)
      ).to.be.revertedWith("already-disabled");
    });
  });
});

//TODOS
// - ConnectorArray check
// - Multiple events fetch
// - Removing all authorities should revert
