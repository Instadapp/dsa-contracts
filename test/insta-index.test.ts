import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
const { web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle;
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);

import expectEvent from "../scripts/expectEvent";
import instaDeployContract from "../scripts/deployContract";

import { Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/dist/types";
import BigNumber from "bignumber.js";

describe("InstaIndex", function () {
  const addr_zero = ethers.constants.AddressZero;

  let instaIndex: Contract,
    instaList: Contract,
    instaConnectors: Contract,
    instaAccount: Contract,
    instaDefaultAccountV2: Contract,
    instaConnectorsV2: Contract,
    instaAccountTestV3: Contract,
    instaAccountTestV4: Contract;

  let masterSigner: Signer;
  let deployer: SignerWithAddress,
    signer: SignerWithAddress,
    newMaster: SignerWithAddress;

  const wallets = provider.getWallets();
  let [wallet0, wallet1, wallet2, wallet3] = wallets;
  let setBasicsArgs: [string, string, string, string];
  let versionCount = 0;
  let masterAddress: Address;
  let dsaWallet0: Contract;

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

    [deployer, signer, newMaster] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    masterAddress = deployerAddress;

    console.log(`\tDeployer Address: ${deployerAddress}`);

    instaIndex = await instaDeployContract("InstaIndex", []);

    instaList = await instaDeployContract("InstaList", [instaIndex.address]);

    instaAccount = await instaDeployContract("InstaAccount", [
      instaIndex.address,
    ]);

    instaAccountTestV3 = await instaDeployContract("InstaAccountV3", []);
    instaAccountTestV4 = await instaDeployContract("InstaAccountV4", []);

    instaConnectors = await instaDeployContract("InstaConnectors", [
      instaIndex.address,
    ]);

    instaDefaultAccountV2 = await instaDeployContract(
      "InstaDefaultImplementation",
      [instaIndex.address]
    );

    instaConnectorsV2 = await instaDeployContract("InstaConnectorsV2", [
      instaIndex.address,
    ]);

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
  });

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
    versionCount++;
  });

  it("should revert on setting the basics again", async function () {
    setBasicsArgs = [
      masterAddress,
      instaList.address,
      instaAccount.address,
      instaConnectors.address,
    ];
    await expect(instaIndex.setBasics(...setBasicsArgs)).to.be.revertedWith(
      "already-defined"
    );
  });

  it("should check the state", async function () {
    expect(await instaIndex.master()).to.be.equal(masterAddress);
    console.log("\tMaster set...");
    expect(await instaIndex.list()).to.be.equal(instaList.address);
    console.log("\tList registry module set...");
    let versionCount = await instaIndex.versionCount();
    expect(versionCount).to.be.equal(versionCount);
    console.log("\tVersion count set...");
    expect(await instaIndex.connectors(versionCount)).to.be.equal(
      instaConnectors.address
    );
    console.log("\tConnectors Registry Module set...");
    expect(await instaIndex.account(versionCount)).to.be.equal(
      instaAccount.address
    );
    console.log("\tAccount module set...");
    expect(await instaIndex.check(versionCount)).to.be.equal(addr_zero);
    console.log("\tCheck module set to 0x00...");
  });

  describe("Only Master", function () {
    describe("Change Master", function () {
      it("should revert if calling method with non-master signer", async function () {
        await expect(
          instaIndex.connect(signer).changeMaster(newMaster.address)
        ).to.be.revertedWith("not-master");
      });

      it("should revert if new master is same as master", async function () {
        await expect(
          instaIndex.connect(masterSigner).changeMaster(masterAddress)
        ).to.be.revertedWith("already-a-master");
      });

      it("should revert if new master is zero address", async function () {
        await expect(
          instaIndex.connect(masterSigner).changeMaster(addr_zero)
        ).to.be.revertedWith("not-valid-address");
      });

      it("should change newMaster", async function () {
        const tx = await instaIndex
          .connect(masterSigner)
          .changeMaster(newMaster.address);
        const txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        let args = {
          master: newMaster.address,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewMaster",
          args
        );
        console.log("\tLogNewMaster event fired...");
        expect(await instaIndex.master()).to.be.equal(masterAddress);
        await expect(
          instaIndex.connect(newMaster).changeMaster(masterAddress)
        ).to.be.revertedWith("not-master");
      });

      it("should revert setting the newMaster to already newMaster address", async function () {
        await expect(
          instaIndex.connect(masterSigner).changeMaster(newMaster.address)
        ).to.be.revertedWith("already-a-new-master");
      });
    });

    describe("Update Master", function () {
      it("should revert calling with non-new-master", async function () {
        await expect(
          instaIndex.connect(masterSigner).updateMaster()
        ).to.be.revertedWith("not-master");
      });

      it("should update the master to new master", async function () {
        const tx = await instaIndex.connect(newMaster).updateMaster();
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        let args = {
          master: newMaster.address,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogUpdateMaster",
          args
        );
        console.log("\tLogUpdateMaster event fired...");
        expect(await instaIndex.master()).to.be.equal(newMaster.address);
      });

      it("should revert updating master without changing", async function () {
        await expect(
          instaIndex.connect(newMaster).updateMaster()
        ).to.be.revertedWith("not-valid-address");
      });
    });

    describe("Add new account module", function () {
      it("should revert if calling method with non-master signer", async function () {
        await expect(
          instaIndex
            .connect(signer)
            .addNewAccount(
              instaDefaultAccountV2.address,
              instaConnectorsV2.address,
              addr_zero
            )
        ).to.be.revertedWith("not-master");
      });

      it("should revert when adding zero-address-account", async function () {
        await expect(
          instaIndex
            .connect(newMaster)
            .addNewAccount(addr_zero, instaConnectorsV2.address, addr_zero)
        ).to.be.revertedWith("not-valid-address");
      });

      it("should revert when adding existing module (incorrect version)", async function () {
        await expect(
          instaIndex
            .connect(newMaster)
            .addNewAccount(
              instaAccount.address,
              instaConnectorsV2.address,
              addr_zero
            )
        ).to.be.revertedWith("not-valid-version");
      });

      it("should add new module with connectors and zero-check address", async function () {
        const tx = await instaIndex
          .connect(newMaster)
          .addNewAccount(
            instaDefaultAccountV2.address,
            instaConnectorsV2.address,
            addr_zero
          );
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        versionCount++;
        let accountArgs = {
          _newAccount: instaDefaultAccountV2.address,
          _connectors: instaConnectorsV2.address,
          _check: addr_zero,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewAccount",
          accountArgs
        );
        console.log("\tLogNewAccount event fired...");
      });

      it("should add new module with no connector registry and zero-check address", async function () {
        const tx = await instaIndex
          .connect(newMaster)
          .addNewAccount(instaAccountTestV3.address, addr_zero, addr_zero);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        versionCount++;
        let accountArgs = {
          _newAccount: instaAccountTestV3.address,
          _connectors: addr_zero,
          _check: addr_zero,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewAccount",
          accountArgs
        );
        console.log("\tLogNewAccount event fired...");
      });

      it("should add new module with connector registry and check module", async function () {
        let check_addr = "0x8a5419CfC711B2343c17a6ABf4B2bAFaBb06957F";
        const tx = await instaIndex
          .connect(newMaster)
          .addNewAccount(
            instaAccountTestV4.address,
            instaConnectors.address,
            check_addr
          );
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        versionCount++;
        let accountArgs = {
          _newAccount: instaAccountTestV4.address,
          _connectors: instaConnectors.address,
          _check: check_addr,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewAccount",
          accountArgs
        );
        console.log("\tLogNewAccount event fired...");
      });

      it("should check the versionCount for new module", async function () {
        expect(await instaIndex.versionCount()).to.be.equal(versionCount);
      });

      it("should revert on re-adding same check module to same version", async function () {
        let check_addr = await instaIndex.check(1); //check module address for version 1
        await expect(
          instaIndex.connect(newMaster).changeCheck(1, check_addr)
        ).to.be.revertedWith("already-a-check");
      });

      it("should change check module address", async function () {
        let check_addr = "0x8a5419CfC711B2343c17a6ABf4B2bAFaBb06957F"; //checking for a dummy check address
        let tx = await instaIndex.connect(newMaster).changeCheck(1, check_addr);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        let args = {
          accountVersion: "1",
          check: check_addr,
        };
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewCheck",
          args
        );
        console.log("\tLogNewCheck event fired...");
      });

      it("can add same check module to multiple versions", async function () {
        let check_addr = "0x8a5419CfC711B2343c17a6ABf4B2bAFaBb06957F"; //checking for a dummy check address
        let tx = await instaIndex.connect(newMaster).changeCheck(2, check_addr);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogNewCheck",
          {
            accountVersion: "2",
            check: check_addr,
          }
        );
        console.log("\tLogNewCheck event fired...");
      });
    });

    describe("Build DSA", function () {
      let accounts_before: any,
        accounts_after: any,
        userLink_before: any,
        userLink_after: any,
        userList_before: any,
        userList_after: any,
        accountLink_before: any,
        accountLink_after: any,
        accountList_before: any,
        accountList_after: any,
        dsaWallet1: Contract;
      it("should check if account module is clone", async function () {
        expect(await instaIndex.isClone(1, instaAccount.address)).to.be.false;
      });

      it("should revert with incorrect account version", async function () {
        await expect(
          instaIndex.connect(wallet0).build(wallet0.address, 0, addr_zero)
        ).to.be.revertedWith("not-valid-account");
        await expect(
          instaIndex
            .connect(wallet0)
            .build(wallet0.address, versionCount + 1, addr_zero)
        ).to.be.revertedWith("not-valid-account");
      });

      it("should get account count and list links before building DSA", async function () {
        accounts_before = await instaList.accounts();
        console.log("\tPrevious Account ID: ", accounts_before);
        userLink_before = await instaList.userLink(wallet0.address);
        expect(userLink_before.first).to.be.equal(new BigNumber(0).toString());
        expect(userLink_before.last).to.be.equal(new BigNumber(0).toString());
        expect(userLink_before.count).to.be.equal(new BigNumber(0).toString());
        userList_before = await instaList.userList(
          wallet0.address,
          new BigNumber(accounts_before.toString()).plus(1).toString()
        );
        expect(userList_before.prev).to.be.equal(new BigNumber(0).toString());
        expect(userList_before.next).to.be.equal(new BigNumber(0).toString());
        accountLink_before = await instaList.accountLink(
          new BigNumber(accounts_before.toString()).plus(1).toString()
        );
        expect(accountLink_before.first).to.be.equal(addr_zero);
        expect(accountLink_before.last).to.be.equal(addr_zero);
        expect(accountLink_before.count).to.be.equal(
          new BigNumber(0).toString()
        );
        accountList_before = await instaList.accountList(
          new BigNumber(accounts_before.toString()).plus(1).toString(),
          wallet0.address
        );
        expect(accountList_before.prev).to.be.equal(addr_zero);
        expect(accountList_before.next).to.be.equal(addr_zero);
      });

      it("should build DSA v1", async function () {
        let tx = await instaIndex
          .connect(wallet0)
          .build(wallet0.address, 1, wallet0.address);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        dsaWallet0 = await ethers.getContractAt(
          (
            await deployments.getArtifact("InstaAccount")
          ).abi,
          txDetails.events[1].args.account
        );
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaAccount")).abi,
          "LogEnable",
          {
            user: wallet0.address,
          }
        );
        console.log("\tLogEnable event fired...");
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogAccountCreated",
          {
            sender: wallet0.address,
            owner: wallet0.address,
            account: dsaWallet0.address,
            origin: wallet0.address,
          }
        );
        console.log("\tLogAccountCreated event fired...");
      });

      it("should increment the account ID", async function () {
        accounts_after = await instaList.accounts();
        expect(accounts_after).to.be.equal(
          new BigNumber(accounts_before.toString()).plus(1).toString()
        );
      });

      it("should add account to the list registry", async function () {
        expect(await instaList.accountID(dsaWallet0.address)).to.be.equal(
          accounts_after
        );
        console.log("\tAccount address to ID mapping updated...");
        expect(await instaList.accountAddr(accounts_after)).to.be.equal(
          dsaWallet0.address
        );
        console.log("\tAccount ID to address mapping updated...");
      });

      it("should add owner as auth in account module", async function () {
        expect(await dsaWallet0.isAuth(wallet0.address)).to.be.true;
      });

      it("should update account links in list registry", async function () {
        userLink_after = await instaList.userLink(wallet0.address);
        expect(userLink_after.first).to.be.equal(accounts_after);
        expect(userLink_after.last).to.be.equal(accounts_after);
        expect(userLink_after.count).to.be.equal(new BigNumber(1).toString());
        console.log("\tUserLink updated...");
        userList_after = await instaList.userList(
          wallet0.address,
          new BigNumber(accounts_after.toString()).toString()
        );
        expect(userList_after.prev).to.be.equal(new BigNumber(0).toString());
        expect(userList_after.next).to.be.equal(new BigNumber(0).toString());
        console.log("\tUserList updated...");
        accountLink_after = await instaList.accountLink(accounts_after);
        expect(accountLink_after.first).to.be.equal(wallet0.address);
        expect(accountLink_after.last).to.be.equal(wallet0.address);
        expect(accountLink_after.count).to.be.equal(
          new BigNumber(1).toString()
        );
        console.log("\tAccountLink updated...");
        accountList_after = await instaList.accountList(
          accounts_after,
          wallet0.address
        );
        expect(accountList_after.prev).to.be.equal(addr_zero);
        expect(accountList_after.next).to.be.equal(addr_zero);
        console.log("\tAccountList updated...");
      });

      it("should check DSA is clone of account module v1", async function () {
        expect(await instaIndex.isClone(1, dsaWallet0.address)).to.be.true;
      });

      it("should build dsa v1 with owner not same as sender", async function () {
        let tx = await instaIndex
          .connect(wallet1)
          .build(wallet0.address, 1, wallet0.address);
        let txDetails = await tx.wait();
        expect(!!txDetails.status).to.be.true;
        dsaWallet1 = await ethers.getContractAt(
          (
            await deployments.getArtifact("InstaAccount")
          ).abi,
          txDetails.events[1].args.account
        );

        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaAccount")).abi,
          "LogEnable",
          {
            user: wallet0.address,
          }
        );
        console.log("\tLogEnable event fired...");
        expectEvent(
          txDetails,
          (await deployments.getArtifact("InstaIndex")).abi,
          "LogAccountCreated",
          {
            sender: wallet1.address,
            owner: wallet0.address,
            account: dsaWallet1.address,
            origin: wallet0.address,
          }
        );
        console.log("\tLogAccountCreated event fired...");
      });
    });
  });
});
