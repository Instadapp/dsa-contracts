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

import type { Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/dist/types";

describe("InstaIndex", function () {
  const addr_zero = ethers.constants.AddressZero;

  let instaIndex: Contract,
    instaList: Contract,
    instaConnectors: Contract,
    instaAccount: Contract,
    instaDefaultAccountV2: Contract,
    instaConnectorsV2: Contract;

  let masterSigner: Signer;
  let deployer: SignerWithAddress,
    signer: SignerWithAddress,
    newMaster: SignerWithAddress;

  const wallets = provider.getWallets();
  let [wallet0, wallet1, wallet2, wallet3] = wallets;
  let setBasicsArgs: [string, string, string, string];
  let versionCount = 0;
  let masterAddress: Address;
  let dsaWallet0: Address;

  before(async () => {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            // @ts-ignore
            jsonRpcUrl: hre.config.networks.hardhat.forking.url,
            blockNumber: 12068005,
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

      it("should add new module", async function () {
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

      it("should build DSA v1", async function () {
        let tx = await instaIndex
          .connect(wallet0)
          .build(wallet0.address, 1, wallet0.address);
        let txDetails = await tx.wait();
      });
    });
  });
});
