const {
  expect
} = require("chai");
const hre = require("hardhat");
const {
  web3,
  deployments
} = hre;
const {
  provider
} = waffle

const deployContracts = require("../scripts/deployContracts")
const deployConnector = require("../scripts/deployConnector")

const encodeSpells = require("../scripts/encodeSpells.js")
const expectEvent = require("../scripts/expectEvent")

const getMasterSigner = require("../scripts/getMasterSigner")

const addresses = require("../scripts/constant/addresses");
const abis = require("../scripts/constant/abis");

describe("Core", function () {
  const address_zero = "0x0000000000000000000000000000000000000000"

  let
    instaConnectorsV2,
    implementationsMapping,
    instaAccountV2Proxy,
    instaAccountV2ImplM1,
    instaAccountV2ImplM2,
    instaAccountV2DefaultImpl,
    instaIndex

  const instaAccountV2DefaultImplSigs = [
    "enable(address)",
    "disable(address)",
    "isAuth(address)",
  ].map((a) => web3.utils.keccak256(a).slice(0, 10))

  const instaAccountV2ImplM1Sigs = [
    "cast(address[],bytes[],address)"
  ].map((a) => web3.utils.keccak256(a).slice(0, 10))

  const instaAccountV2ImplM2Sigs = [
    "castWithFlashloan(address[],bytes[],address)"
  ].map((a) => web3.utils.keccak256(a).slice(0, 10))

  let masterSigner;

  let acountV2DsaM1Wallet0;
  let acountV2DsaM2Wallet0;
  let acountV2DsaDefaultWallet0;

  const wallets = provider.getWallets()
  let [wallet0, wallet1, wallet2, wallet3] = wallets
  before(async () => {
    const result = await deployContracts()
    instaAccountV2DefaultImpl = result.instaAccountV2DefaultImpl
    instaIndex = result.instaIndex
    instaConnectorsV2 = result.instaConnectorsV2
    implementationsMapping = result.implementationsMapping
    instaAccountV2Proxy = result.instaAccountV2Proxy
    instaAccountV2ImplM1 = result.instaAccountV2ImplM1
    instaAccountV2ImplM2 = result.instaAccountV2ImplM2

    masterSigner = await getMasterSigner()
  })

  it("Should have contracts deployed.", async function () {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!implementationsMapping.address).to.be.true;
    expect(!!instaAccountV2Proxy.address).to.be.true;
    expect(!!instaAccountV2ImplM1.address).to.be.true;
    expect(!!instaAccountV2ImplM2.address).to.be.true;
  });

  describe("Implementations", function () {
    it("Should add default implementation to mapping.", async function () {
      const tx = await implementationsMapping.connect(masterSigner).setDefaultImplementation(instaAccountV2DefaultImpl.address);
      await tx.wait()
      expect(await implementationsMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
    });

    it("Should add instaAccountV2ImplM1 sigs to mapping.", async function () {
      const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM1.address, instaAccountV2ImplM1Sigs);
      await tx.wait()
      expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM1Sigs[0])).to.be.equal(instaAccountV2ImplM1.address);
      (await implementationsMapping.getImplementationSigs(instaAccountV2ImplM1.address)).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2ImplM1Sigs[i])
      })
    });

    it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs);
      await tx.wait()
      expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2ImplM2.address);
      (await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2ImplM2Sigs[i])
      })
    });

    it("Should add InstaAccountV2Proxy in Index.sol", async function () {
      const tx = await instaIndex.connect(masterSigner).addNewAccount(instaAccountV2Proxy.address, address_zero, address_zero)
      await tx.wait()
      expect(await instaIndex.account(2)).to.be.equal(instaAccountV2Proxy.address);
    });

    it("Should remove instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping.connect(masterSigner).removeImplementation(instaAccountV2ImplM2.address);
      await tx.wait()
      expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(address_zero);
      expect((await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).length).to.be.equal(0);
    });

    it("Should return default imp.", async function () {
      expect(await implementationsMapping.getImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2DefaultImpl.address);
    });

    after(async () => {
      const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs);
      await tx.wait()
    });

  });

  describe("Auth", function () {

    it("Should build DSA v2", async function () {
      const tx = await instaIndex.connect(wallet0).build(wallet0.address, 2, wallet0.address)
      const dsaWalletAddress = "0xc8F3572102748a9956c2dFF6b998bd6250E3264c"
      expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);
      acountV2DsaM1Wallet0 = await ethers.getContractAt("InstaAccountV2ImplementationM1", dsaWalletAddress);
      acountV2DsaM2Wallet0 = await ethers.getContractAt("InstaAccountV2ImplementationM2", dsaWalletAddress);
      acountV2DsaDefaultWallet0 = await ethers.getContractAt("InstaAccountV2DefaultImplementation", dsaWalletAddress);
    });

    it("Should deploy Auth connector", async function () {
      await deployConnector({
        connectorName: "authV2",
        contract: "ConnectV2Auth",
        abi: (await deployments.getArtifact("ConnectV2Auth")).abi
      })
      expect(!!addresses.connectors["authV2"]).to.be.true
      await instaConnectorsV2.connect(masterSigner).toggleConnectors([addresses.connectors["authV2"]])
    });

    it("Should deploy EmitEvent connector", async function () {
      await deployConnector({
        connectorName: "emitEvent",
        contract: "ConnectV2EmitEvent",
        abi: (await deployments.getArtifact("ConnectV2EmitEvent")).abi
      })
      expect(!!addresses.connectors["emitEvent"]).to.be.true
      await instaConnectorsV2.connect(masterSigner).toggleConnectors([addresses.connectors["emitEvent"]])
    });

    it("Should add wallet1 as auth", async function () {
      const spells = {
        connector: "authV2",
        method: "add",
        args: [wallet1.address]
      }
      const tx = await acountV2DsaM1Wallet0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
      const receipt = await tx.wait()
      const logCastEvent = expectEvent(receipt, (await deployments.getArtifact("InstaAccountV2ImplementationM1")).abi, "LogCast")
      const LogAddAuthEvent = expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
    });

    it("Should add wallet2 as auth", async function () {
      const spells = {
        connector: "authV2",
        method: "add",
        args: [wallet2.address]
      }
      const tx = await acountV2DsaM2Wallet0.connect(wallet1).castWithFlashloan(...encodeSpells([spells]), wallet1.address)
      const receipt = await tx.wait()
      const logCastEvent = expectEvent(receipt, (await deployments.getArtifact("InstaAccountV2ImplementationM2")).abi, "LogCast")
      const LogAddAuthEvent = expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
    });

  });

  describe("Events", function () {

    before(async function () {
      const tx = await instaIndex.connect(wallet0).build(wallet1.address, 2, wallet1.address)
      const dsaWalletAddress = "0x15701ad369a488EA2b89Fa5525e3FD5d96cE40cf"
      expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);

      acountV2DsaM1Wallet0 = await ethers.getContractAt("InstaAccountV2ImplementationM1", dsaWalletAddress);
      acountV2DsaM2Wallet0 = await ethers.getContractAt("InstaAccountV2ImplementationM2", dsaWalletAddress);
      acountV2DsaDefaultWallet0 = await ethers.getContractAt("InstaAccountV2DefaultImplementation", dsaWalletAddress);
    });

    it("Should new connector", async function () {
      await deployConnector({
        connectorName: "authV1",
        contract: "ConnectV2Auth",
        abi: (await deployments.getArtifact("ConnectV2Auth")).abi
      })
      expect(!!addresses.connectors["authV1"]).to.be.true
      await instaConnectorsV2.connect(masterSigner).toggleConnectors([addresses.connectors["authV1"]])
    });

    it("Should emit event from wallet1", async function () {
      const spells = {
        connector: "authV1",
        method: "add",
        args: [wallet3.address]
      }
      const tx = await acountV2DsaM1Wallet0.connect(wallet1).cast(...encodeSpells([spells]), wallet3.address)
      const receipt = await tx.wait()
      expectEvent(receipt, (await deployments.getArtifact("InstaAccountV2ImplementationM1")).abi, "LogCast")
      expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
    });
  });
});
