import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
const { web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle;

import deployConnector from "../scripts/deployConnector";
import encodeSpells from "../scripts/encodeSpells";
import expectEvent from "../scripts/expectEvent";
import getMasterSigner from "../scripts/getMasterSigner";
import addresses from "../scripts/constant/addresses";

import {
  ConnectV2Auth__factory,
  InstaAccountV2,
  InstaConnectorsV2,
  InstaImplementationM1,
  InstaDefaultImplementation,
  InstaImplementationM2,
  InstaDefaultImplementationV2,
  InstaImplementations,
  InstaIndex,
  ConnectCompound__factory,
  InstaDefaultImplementationV2__factory,
  InstaImplementationM2__factory,
  ConnectV2EmitEvent__factory,
} from "../typechain";

import type { Contract, Signer } from "ethers";

describe("Mainnet", function () {
  const address_zero = ethers.constants.AddressZero;
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const cEthAddr = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
  const cDaiAddr = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
  const maxValue =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  const CONNECTORS_V2_ADDRESS = "0xFE2390DAD597594439f218190fC2De40f9Cf1179";
  const IMPLEMENTATIONS_ADDRESS = "0xCBA828153d3a85b30B5b912e1f2daCac5816aE9D";
  const ACCOUNT_V2_ADDRESS = "0xFE02a32Cbe0CB9ad9A945576A5bb53A3C123A3A3";
  const DEFAULT_IMPLEMENTATION_ADDRESS =
    "0x28aDcDC02Ca7B3EDf11924102726066AA0fA7010";
  const M1_IMPLEMENTATION_ADDRESS =
    "0x77a34e599dA1e37215445c5740D57b63E5Bb98FD";
  const INSTA_INDEX = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";
  let INSTA_LIST = "0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb";

  let instaConnectorsV2: Contract,
    implementationsMapping: Contract,
    instaAccountV2Proxy: Contract,
    instaAccountV2ImplM1: Contract,
    instaAccountV2ImplM2: Contract,
    instaAccountV2DefaultImpl: Contract,
    instaAccountV2DefaultImplV2: Contract,
    instaIndex: Contract;

  const instaAccountV2DefaultImplSigsV2 = [
    "enable(address)",
    "disable(address)",
    "isAuth(address)",
    "switchShield(bool",
    "shield()",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  const instaAccountV2ImplM1Sigs = ["cast(string[],bytes[],address)"].map((a) =>
    web3.utils.keccak256(a).slice(0, 10)
  );

  const instaAccountV2ImplM2Sigs = [
    "castWithFlashloan(string[],bytes[],address)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10));

  let masterSigner: Signer;

  let acountV2DsaM1Wallet0: Contract;
  let acountV2DsaM2Wallet0: Contract;
  let acountV2DsaDefaultWallet0: Contract;
  let acountV2DsaDefaultWalletM2: Contract;

  let authV3: Contract,
    authV4: Contract,
    compound: Contract,
    compound2: Contract;

  const wallets = provider.getWallets();
  let [wallet0, wallet1, wallet2, wallet3] = wallets;

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
    instaAccountV2DefaultImpl = await ethers.getContractAt(
      "InstaDefaultImplementation",
      DEFAULT_IMPLEMENTATION_ADDRESS
    );
    instaIndex = await ethers.getContractAt("InstaIndex", INSTA_INDEX);
    instaConnectorsV2 = await ethers.getContractAt(
      "InstaConnectorsV2",
      CONNECTORS_V2_ADDRESS
    );
    implementationsMapping = await ethers.getContractAt(
      "InstaImplementations",
      IMPLEMENTATIONS_ADDRESS
    );
    instaAccountV2Proxy = await ethers.getContractAt(
      "InstaAccountV2",
      ACCOUNT_V2_ADDRESS
    );
    instaAccountV2ImplM1 = await ethers.getContractAt(
      "InstaImplementationM1",
      M1_IMPLEMENTATION_ADDRESS
    );

    masterSigner = await getMasterSigner();

    instaAccountV2ImplM2 = await deployContract(
      masterSigner,
      InstaImplementationM2__factory,
      [instaIndex.address, instaConnectorsV2.address]
    );
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
    it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplM2.address,
          instaAccountV2ImplM2Sigs
        );
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2ImplM2Sigs[0]
        )
      ).to.be.equal(instaAccountV2ImplM2.address);
      (
        await implementationsMapping.getImplementationSigs(
          instaAccountV2ImplM2.address
        )
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(instaAccountV2ImplM2Sigs[i]);
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

    it("Should remove instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .removeImplementation(instaAccountV2ImplM2.address);
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2ImplM2Sigs[0]
        )
      ).to.be.equal(address_zero);
      expect(
        (
          await implementationsMapping.getImplementationSigs(
            instaAccountV2ImplM2.address
          )
        ).length
      ).to.be.equal(0);
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
      ).forEach((a: any, i: string | number) => {
        expect(a).to.be.eq(instaAccountV2DefaultImplSigsV2[i]);
      });
    });

    it("Should remove InstaDefaultImplementationV2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .removeImplementation(instaAccountV2DefaultImplV2.address);
      await tx.wait();
      expect(
        await implementationsMapping.getSigImplementation(
          instaAccountV2DefaultImplSigsV2[0]
        )
      ).to.be.equal(address_zero);
      expect(
        (
          await implementationsMapping.getImplementationSigs(
            instaAccountV2DefaultImplV2.address
          )
        ).length
      ).to.be.equal(0);
    });

    it("Should return default imp.", async function () {
      expect(
        await implementationsMapping.getImplementation(
          instaAccountV2ImplM2Sigs[0]
        )
      ).to.be.equal(instaAccountV2DefaultImpl.address);
    });

    after(async () => {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          instaAccountV2ImplM2.address,
          instaAccountV2ImplM2Sigs
        );
      await tx.wait();
    });
  });

  describe("Auth", function () {
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
      acountV2DsaM2Wallet0 = await ethers.getContractAt(
        "InstaImplementationM2",
        dsaWalletAddress
      );
      acountV2DsaDefaultWallet0 = await ethers.getContractAt(
        "InstaDefaultImplementation",
        dsaWalletAddress
      );
      acountV2DsaDefaultWalletM2 = await ethers.getContractAt(
        "InstaDefaultImplementationV2",
        dsaWalletAddress
      );
    });

    it("Should deploy Auth connector", async function () {
      await deployConnector(
        {
          connectorName: "authV2",
          contract: "ConnectV2Auth",
          factory: ConnectV2Auth__factory,
        },
        [INSTA_LIST]
      );
      expect(!!addresses.connectors["authV2"]).to.be.true;
      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(["authV2"], [addresses.connectors["authV2"]]);
    });

    it("Should deploy EmitEvent connector", async function () {
      await deployConnector({
        connectorName: "emitEvent",
        contract: "ConnectV2EmitEvent",
        factory: ConnectV2EmitEvent__factory,
      });
      expect(!!addresses.connectors["emitEvent"]).to.be.true;
      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(["emitEvent"], [addresses.connectors["emitEvent"]]);
    });

    it("Should add wallet1 as auth", async function () {
      const spells = {
        connector: "authV2",
        method: "add",
        args: [wallet1.address],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet0)
        .cast(encodedSpells[0], encodedSpells[1], wallet1.address);
      const receipt = await tx.wait();
      const logCastEvent = expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
      const LogAddAuthEvent = expectEvent(
        receipt,
        (await deployments.getArtifact("ConnectV2Auth")).abi,
        "LogAddAuth"
      );
    });

    it("Should add wallet2 as auth", async function () {
      const spells = {
        connector: "authV2",
        method: "add",
        args: [wallet2.address],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM2Wallet0
        .connect(wallet1)
        .castWithFlashloan(encodedSpells[0], encodedSpells[1], wallet1.address);
      const receipt = await tx.wait();
      const logCastEvent = expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM2")).abi,
        "LogCast"
      );
      const LogAddAuthEvent = expectEvent(
        receipt,
        (await deployments.getArtifact("ConnectV2Auth")).abi,
        "LogAddAuth"
      );
    });

    it("Should remove wallet1 as auth", async function () {
      const spells = {
        connector: "authV2",
        method: "remove",
        args: [wallet1.address],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet2)
        .cast(encodedSpells[0], encodedSpells[1], wallet2.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM2")).abi,
        "LogCast"
      );
      expectEvent(
        receipt,
        (await deployments.getArtifact("ConnectV2Auth")).abi,
        "LogRemoveAuth"
      );
    });

    it("Should change default implementation", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .setDefaultImplementation(instaAccountV2DefaultImplV2.address);
      await tx.wait();
      expect(await implementationsMapping.defaultImplementation()).to.be.equal(
        instaAccountV2DefaultImplV2.address
      );
    });

    it("Should add wallet3 as auth using default implmentation", async function () {
      const tx = await acountV2DsaDefaultWallet0
        .connect(wallet0)
        .enable(wallet3.address);
      const receipt = await tx.wait();

      expect(await acountV2DsaDefaultWallet0.isAuth(wallet3.address)).to.be
        .true;
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaDefaultImplementationV2")).abi,
        "LogEnableUser"
      );
    });

    it("Should remove wallet0 as auth using default implmentation", async function () {
      const tx = await acountV2DsaDefaultWallet0
        .connect(wallet3)
        .disable(wallet0.address);
      const receipt = await tx.wait();

      expect(await acountV2DsaDefaultWallet0.isAuth(wallet0.address)).to.be
        .false;
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaDefaultImplementationV2")).abi,
        "LogDisableUser"
      );
    });

    it("Should switch shield", async function () {
      const tx = await acountV2DsaDefaultWalletM2
        .connect(wallet3)
        .switchShield(true);
      const receipt = await tx.wait();

      expect(await acountV2DsaDefaultWalletM2.shield()).to.be.true;
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaDefaultImplementationV2")).abi,
        "LogSwitchShield"
      );
    });
  });

  describe("Events", function () {
    before(async function () {
      const tx = await instaIndex
        .connect(wallet0)
        .build(wallet1.address, 2, wallet1.address);
      const dsaWalletAddress = "0x1ca642f25E95D43B7BCbf7570C9bC7Ef1d24ed37";
      expect((await tx.wait()).events[1].args.account).to.be.equal(
        dsaWalletAddress
      );

      acountV2DsaM1Wallet0 = await ethers.getContractAt(
        "InstaImplementationM1",
        dsaWalletAddress
      );
      acountV2DsaM2Wallet0 = await ethers.getContractAt(
        "InstaImplementationM2",
        dsaWalletAddress
      );
      acountV2DsaDefaultWallet0 = await ethers.getContractAt(
        "InstaDefaultImplementation",
        dsaWalletAddress
      );
    });

    it("Should new connector", async function () {
      await deployConnector({
        connectorName: "authV1",
        contract: "ConnectV2Auth",
        factory: ConnectV2Auth__factory,
      }, [INSTA_LIST]);
      expect(!!addresses.connectors["authV1"]).to.be.true;
      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(["authV1"], [addresses.connectors["authV1"]]);
    });

    it("Should emit event from wallet1", async function () {
      const spells = {
        connector: "authV1",
        method: "add",
        args: [wallet3.address],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
      expectEvent(
        receipt,
        (await deployments.getArtifact("ConnectV2Auth")).abi,
        "LogAddAuth"
      );
    });

    it("Should emit emitEvent", async function () {
      const spells = {
        connector: "emitEvent",
        method: "emitEvent",
        args: [],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const eventAbi = (await deployments.getArtifact("ConnectV2EmitEvent"))
        .abi;

      const castEvent = [
        {
          abi: eventAbi,
          eventName: "LogEmitEvent",
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, eventAbi, "LogEmitEvent");
    });
  });

  describe("Connectors", function () {
    before(async function () {
      compound = await deployContract(
        masterSigner,
        ConnectCompound__factory,
        []
      );
      authV3 = await deployContract(masterSigner, ConnectV2Auth__factory, [INSTA_LIST]);
      authV4 = await deployContract(masterSigner, ConnectV2Auth__factory, [INSTA_LIST]);
      compound2 = await deployContract(
        masterSigner,
        ConnectCompound__factory,
        []
      );
    });

    it("Connector adding should work", async function () {
      const connectorsArray = ["authV3"];
      const addressesArray = [authV3.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.true;
    });

    it("Cannot add same connector name twice", async function () {
      const connectorsArray = ["authV3"];
      const addressesArray = [authV3.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;

      await expect(
        instaConnectorsV2
          .connect(masterSigner)
          .addConnectors(connectorsArray, addressesArray)
      ).to.be.revertedWith("addConnectors: _connectorName added already");
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.true;
    });

    it("Multiple connectors can be added", async function () {
      const connectorsArray = ["authV4", "compound"];
      const addressesArray = [authV4.address, compound.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.true;
    });

    it("Connector can be removed", async function () {
      const connectorsArray = ["authV3"];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;

      await instaConnectorsV2
        .connect(masterSigner)
        .removeConnectors(connectorsArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.false;
    });

    it("Multiple connectors can be removed", async function () {
      const connectorsArray = ["authV4", "compound"];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;

      await instaConnectorsV2
        .connect(masterSigner)
        .removeConnectors(connectorsArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.false;
    });

    it("Connector can be added 2", async function () {
      const connectorsArray = ["authV3"];
      const addressesArray = [authV3.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.true;
    });

    it("Returns false if one of them is not a connector", async function () {
      const connectorsArray = ["authV4", "compound"];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;
    });

    it("Should add chief", async function () {
      expect(await instaConnectorsV2.chief(wallet0.address)).to.be.false;
      await instaConnectorsV2
        .connect(masterSigner)
        .toggleChief(wallet0.address);
      expect(await instaConnectorsV2.chief(wallet0.address)).to.be.true;
    });

    it("New chief can add connectors", async function () {
      const connectorsArray = ["compound"];
      const addressesArray = [compound.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(wallet0)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.true;
    });

    it("Can update connector addresses", async function () {
      const connectorsArray = ["compound"];
      const addressesArray = [compound2.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;
      expect(addresses).to.not.eql(addressesArray);

      await instaConnectorsV2
        .connect(wallet0)
        .updateConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(addresses).to.be.eql(addressesArray);
      expect(isOk).to.be.true;
    });

    it("Non-chief cannot add connectors", async function () {
      const connectorsArray = ["compoundV2"];
      const addressesArray = [compound.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await expect(
        instaConnectorsV2
          .connect(wallet1)
          .addConnectors(connectorsArray, addressesArray)
      ).to.be.revertedWith("not-an-chief");
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(isOk).to.be.false;
    });

    it("New chief can not add more chief", async function () {
      expect(await instaConnectorsV2.chief(wallet1.address)).to.be.false;
      await expect(
        instaConnectorsV2.connect(wallet0).toggleChief(wallet1.address)
      ).to.be.revertedWith("toggleChief: not-master");
      expect(await instaConnectorsV2.chief(wallet1.address)).to.be.false;
    });

    it("Can update multiple connector addresses", async function () {
      const connectorsArray = ["compound", "authV3"];
      const addressesArray = [compound.address, authV4.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;
      expect(addresses).to.not.eql(addressesArray);

      await instaConnectorsV2
        .connect(masterSigner)
        .updateConnectors(connectorsArray, addressesArray);
      [isOk, addresses] = await instaConnectorsV2.isConnectors(connectorsArray);
      expect(addresses).to.be.eql(addressesArray);
      expect(isOk).to.be.true;
    });

    it("Cannot update non existing connector name", async function () {
      const connectorsArray = ["authV4"];
      const addressesArray = [authV4.address];

      let [isOk, addresses] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;
      expect(addresses).to.not.eql(addressesArray);

      await expect(
        instaConnectorsV2
          .connect(wallet0)
          .updateConnectors(connectorsArray, addressesArray)
      ).to.be.revertedWith(
        "updateConnectors: _connectorName not added to update"
      );
    });

    // after(async () => {
    //   const connectorsArray = [ compound.address ]

    //   expect(await instaConnectorsV2.isConnector(connectorsArray)).to.be.false
    //   await instaConnectorsV2.connect(masterSigner).toggleConnectors(connectorsArray)
    //   expect(await instaConnectorsV2.isConnector(connectorsArray)).to.be.true
    // });
  });

  describe("Connector - Compound", function () {
    before(async () => {
      const connectorsArray = ["basic"];
      const addressesArray = [addresses.connectors["basic"]];

      let [isOk, addresses_] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses_] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;
    });

    it("Should be a deployed connector", async function () {
      const connectorsArray = ["compound"];
      let [isOk, addresses_] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;
    });

    it("Should deposit ETH to wallet", async function () {
      const spells = {
        connector: "basic",
        method: "deposit",
        args: [ethAddr, ethers.utils.parseEther("1.0"), 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address, {
          value: ethers.utils.parseEther("1.0"),
        });
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
    });

    it("Should deposit ETH to Compound", async function () {
      const spells = {
        connector: "compound",
        method: "deposit",
        args: [ethAddr, ethers.utils.parseEther("0.5"), 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;

      const castEvent = [
        {
          abi: compoundAbi,
          eventName: "LogDeposit",
          eventParams: [
            ethAddr,
            cEthAddr,
            ethers.utils.parseEther("0.5"),
            0,
            0,
          ],
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, "LogDeposit");
    });

    it("Should deposit ETH to Compound 2", async function () {
      const spells = {
        connector: "compound",
        method: "deposit",
        args: [ethAddr, maxValue, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
    });

    it("Should Borrow & Payback DAI", async function () {
      const spells = [
        {
          connector: "compound",
          method: "borrow",
          args: [daiAddr, ethers.utils.parseEther("10"), 0, 123],
        },
        {
          connector: "compound",
          method: "payback",
          args: [daiAddr, 0, 123, 0],
        },
      ];
      const encodedSpells = encodeSpells(spells);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;

      const castEvent = [
        {
          abi: compoundAbi,
          eventName: "LogBorrow",
          eventParams: [
            daiAddr,
            cDaiAddr,
            ethers.utils.parseEther("10"),
            0,
            123,
          ],
        },
        {
          abi: compoundAbi,
          eventName: "LogPayback",
          eventParams: [
            daiAddr,
            cDaiAddr,
            ethers.utils.parseEther("10"),
            123,
            0,
          ],
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, "LogBorrow");
      expectEvent(receipt, compoundAbi, "LogPayback");
    });

    it("Should withdraw from Compound", async function () {
      const spells = {
        connector: "compound",
        method: "withdraw",
        args: [ethAddr, ethers.utils.parseEther("0.5"), 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;

      const castEvent = [
        {
          abi: compoundAbi,
          eventName: "LogWithdraw",
          eventParams: [
            ethAddr,
            cEthAddr,
            ethers.utils.parseEther("0.5"),
            0,
            0,
          ],
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, "LogWithdraw");
    });
  });

  describe("Connector - Uniswap", function () {
    before(async () => {
      const connectorsArray = ["uniswap"];
      const addressesArray = [addresses.connectors["uniswap"]];

      let [isOk, addresses_] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.false;

      await instaConnectorsV2
        .connect(masterSigner)
        .addConnectors(connectorsArray, addressesArray);
      [isOk, addresses_] = await instaConnectorsV2.isConnectors(
        connectorsArray
      );
      expect(isOk).to.be.true;
    });

    it("Should deposit ETH to wallet", async function () {
      const spells = {
        connector: "basic",
        method: "deposit",
        args: [ethAddr, ethers.utils.parseEther("5.0"), 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address, {
          value: ethers.utils.parseEther("5.0"),
        });
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
    });

    it("Should swap ETH to DAI", async function () {
      const spells = {
        connector: "uniswap",
        method: "sell",
        args: [daiAddr, ethAddr, ethers.utils.parseEther("0.5"), 0, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const abi = (await deployments.getArtifact("TokenInterface")).abi;
      const daiContract = new ethers.Contract(daiAddr, abi, provider);

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.equal(0);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.not.equal(0);
    });

    it("Should swap DAI to USDC", async function () {
      const abi = (await deployments.getArtifact("TokenInterface")).abi;
      const daiContract = new ethers.Contract(daiAddr, abi, provider);
      const usdcContract = new ethers.Contract(usdcAddr, abi, provider);

      const spells = {
        connector: "uniswap",
        method: "sell",
        args: [
          usdcAddr,
          daiAddr,
          await daiContract.balanceOf(acountV2DsaM1Wallet0.address),
          0,
          0,
          0,
        ],
      };
      const encodedSpells = encodeSpells([spells]);

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.not.equal(0);
      expect(
        await usdcContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.equal(0);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.equal(0);
      expect(
        await usdcContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.not.equal(0);
    });

    it("Should swap ETH to DAI 2", async function () {
      const spells = {
        connector: "uniswap",
        method: "sell",
        args: [daiAddr, ethAddr, ethers.utils.parseEther("0.5"), 0, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const abi = (await deployments.getArtifact("TokenInterface")).abi;
      const daiContract = new ethers.Contract(daiAddr, abi, provider);

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.equal(0);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );

      expect(
        await daiContract.balanceOf(acountV2DsaM1Wallet0.address)
      ).to.not.equal(0);
    });

    it("Should withdraw USDC to Auth Wallet", async function () {
      const abi = (await deployments.getArtifact("TokenInterface")).abi;
      const usdcContract = new ethers.Contract(usdcAddr, abi, provider);

      const usdcBalance = await usdcContract.balanceOf(
        acountV2DsaM1Wallet0.address
      );
      const withdrawAmt = usdcBalance.div(ethers.BigNumber.from(2));

      expect(await usdcContract.balanceOf(wallet1.address)).to.equal(0);

      const spells = {
        connector: "basic",
        method: "withdraw",
        args: [usdcAddr, withdrawAmt, wallet1.address, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );

      expect(await usdcContract.balanceOf(wallet1.address)).to.equal(
        withdrawAmt
      );
    });

    it("Should deposit USDC back to wallet", async function () {
      const abi = (await deployments.getArtifact("TokenInterface")).abi;
      const usdcContract = new ethers.Contract(usdcAddr, abi, provider);

      let tx = await usdcContract
        .connect(wallet1)
        .approve(acountV2DsaM1Wallet0.address, maxValue);
      await tx.wait();

      const spells = {
        connector: "basic",
        method: "deposit",
        args: [usdcAddr, maxValue, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );

      expect(await usdcContract.balanceOf(wallet1.address)).to.equal(0);
    });
  });

  describe("Connector - Compound", function () {
    it("Should deposit USDC to Compound 2", async function () {
      const spells = {
        connector: "compound",
        method: "deposit",
        args: [usdcAddr, maxValue, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;

      const castEvent = [
        {
          abi: compoundAbi,
          eventName: "LogDeposit",
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, "LogDeposit");
    });

    it("Should Borrow & Payback ETH", async function () {
      const spells = [
        {
          connector: "compound",
          method: "borrow",
          args: [ethAddr, ethers.utils.parseEther("0.01"), 0, 1235],
        },
        {
          connector: "compound",
          method: "payback",
          args: [ethAddr, 0, 1235, 0],
        },
      ];
      const encodedSpells = encodeSpells(spells);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;

      const castEvent = [
        {
          abi: compoundAbi,
          eventName: "LogBorrow",
          eventParams: [
            ethAddr,
            cEthAddr,
            ethers.utils.parseEther("0.01"),
            0,
            1235,
          ],
        },
        {
          abi: compoundAbi,
          eventName: "LogPayback",
          eventParams: [
            ethAddr,
            cEthAddr,
            ethers.utils.parseEther("0.01"),
            1235,
            0,
          ],
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, "LogBorrow");
      expectEvent(receipt, compoundAbi, "LogPayback");
    });

    it("Should withdraw USDC from Compound", async function () {
      const spells = {
        connector: "compound",
        method: "withdraw",
        args: [usdcAddr, maxValue, 0, 0],
      };
      const encodedSpells = encodeSpells([spells]);

      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();

      const compoundAbi = (await deployments.getArtifact("ConnectCompound"))
        .abi;
      const eventName = "LogWithdraw";

      const castEvent = [
        {
          abi: compoundAbi,
          eventName,
        },
      ];

      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast",
        null,
        castEvent
      );
      expectEvent(receipt, compoundAbi, eventName);
    });

    it("Should withdraw ETH to any address", async function () {
      const spells = {
        connector: "basic",
        method: "withdraw",
        args: [
          ethAddr,
          maxValue,
          "0xa6932AE12380fc2D5B2A118381EB1eA59aF40A5a",
          0,
          0,
        ],
      };
      const encodedSpells = encodeSpells([spells]);
      const tx = await acountV2DsaM1Wallet0
        .connect(wallet1)
        .cast(encodedSpells[0], encodedSpells[1], wallet3.address);
      const receipt = await tx.wait();
      expectEvent(
        receipt,
        (await deployments.getArtifact("InstaImplementationM1")).abi,
        "LogCast"
      );
    });
  });
});
