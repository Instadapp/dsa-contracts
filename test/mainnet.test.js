const { expect } = require("chai");
const hre = require("hardhat");
const { web3, deployments, waffle, ethers } = hre;
const { provider, deployContract } = waffle

const deployConnector = require("../scripts/deployConnector")

const encodeSpells = require("../scripts/encodeSpells.js")
const expectEvent = require("../scripts/expectEvent")

const getMasterSigner = require("../scripts/getMasterSigner")

const addresses = require("../scripts/constant/addresses")

const compoundArtifact = require("../artifacts/contracts/v2/connectors/test/compound.test.sol/ConnectCompound.json");
const connectAuth = require("../artifacts/contracts/v2/connectors/test/auth.test.sol/ConnectV2Auth.json");
const defaultTest2 = require("../artifacts/contracts/v2/accounts/test/implementation_default.v2.test.sol/InstaDefaultImplementationV2.json");
const m2Test = require("../artifacts/contracts/v2/accounts/test/Implementation_m2.test.sol/InstaImplementationM2.json")

describe("Mainnet", function() {
  const address_zero = "0x0000000000000000000000000000000000000000"
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  const cEthAddr = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5"
  const cDaiAddr = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
  const maxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935"

  const CONNECTORS_V2_ADDRESS = "0x7D53E606308A2E0A1D396F30dc305cc7f8483436"
  const IMPLEMENTATIONS_ADDRESS = "0xCBA828153d3a85b30B5b912e1f2daCac5816aE9D"
  const ACCOUNT_V2_ADDRESS = "0xFE02a32Cbe0CB9ad9A945576A5bb53A3C123A3A3"
  const DEFAULT_IMPLEMENTATION_ADDRESS = "0x28aDcDC02Ca7B3EDf11924102726066AA0fA7010"
  const M1_IMPLEMENTATION_ADDRESS = "0x77a34e599dA1e37215445c5740D57b63E5Bb98FD"

  let
    instaConnectorsV2,
    implementationsMapping,
    instaAccountV2Proxy,
    instaAccountV2ImplM1,
    instaAccountV2ImplM2,
    instaAccountV2DefaultImpl,
    instaAccountV2DefaultImplV2,
    instaIndex

    const instaAccountV2DefaultImplSigsV2 = [
      "enable(address)",
      "disable(address)",
      "isAuth(address)",
      "switchShield(bool",
      "shield()"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))
  
    const instaAccountV2ImplM1Sigs = [
      "cast(string[],bytes[],address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))
  
    const instaAccountV2ImplM2Sigs = [
      "castWithFlashloan(string[],bytes[],address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))
  
    let masterSigner;
  
    let acountV2DsaM1Wallet0;
    let acountV2DsaM2Wallet0;
    let acountV2DsaDefaultWallet0;
    let acountV2DsaDefaultWalletM2;
  
    let authV3, authV4, compound, compound2
  
    const wallets = provider.getWallets()
    let [wallet0, wallet1, wallet2, wallet3] = wallets

    before(async () => {
      instaAccountV2DefaultImpl = await ethers.getContractAt("InstaDefaultImplementation", DEFAULT_IMPLEMENTATION_ADDRESS)
      instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)
      instaConnectorsV2 = await ethers.getContractAt("InstaConnectorsV2", CONNECTORS_V2_ADDRESS)
      implementationsMapping = await ethers.getContractAt("InstaImplementations", IMPLEMENTATIONS_ADDRESS)
      instaAccountV2Proxy = await ethers.getContractAt("InstaAccountV2", ACCOUNT_V2_ADDRESS)
      instaAccountV2ImplM1 = await ethers.getContractAt("InstaImplementationM1", M1_IMPLEMENTATION_ADDRESS)

      masterSigner = await getMasterSigner()

      instaAccountV2ImplM2 = await deployContract(masterSigner, m2Test, [])
      instaAccountV2DefaultImplV2 = await deployContract(masterSigner, defaultTest2, [])
    })

    it("Should have contracts deployed.", async function () {
      expect(!!instaConnectorsV2.address).to.be.true;
      expect(!!implementationsMapping.address).to.be.true;
      expect(!!instaAccountV2Proxy.address).to.be.true;
      expect(!!instaAccountV2ImplM1.address).to.be.true;
      expect(!!instaAccountV2ImplM2.address).to.be.true;
    })

    describe("Implementations", function () {
      it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
        console.log('uwu', instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs)
        const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs);
        await tx.wait()
        expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2ImplM2.address);
        (await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).forEach((a, i) => {
          expect(a).to.be.eq(instaAccountV2ImplM2Sigs[i])
        })
      })

      it("Should add InstaAccountV2 in Index.sol", async function () {
        const tx = await instaIndex.connect(masterSigner).addNewAccount(instaAccountV2Proxy.address, address_zero, address_zero)
        await tx.wait()
        expect(await instaIndex.account(2)).to.be.equal(instaAccountV2Proxy.address);
      })

      it("Should remove instaAccountV2ImplM2 sigs to mapping.", async function () {
        const tx = await implementationsMapping.connect(masterSigner).removeImplementation(instaAccountV2ImplM2.address);
        await tx.wait()
        expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(address_zero);
        expect((await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).length).to.be.equal(0);
      })

      it("Should add InstaDefaultImplementationV2 sigs to mapping.", async function () {
        const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2DefaultImplV2.address, instaAccountV2DefaultImplSigsV2);
        await tx.wait()
        expect(await implementationsMapping.getSigImplementation(instaAccountV2DefaultImplSigsV2[0])).to.be.equal(instaAccountV2DefaultImplV2.address);
        (await implementationsMapping.getImplementationSigs(instaAccountV2DefaultImplV2.address)).forEach((a, i) => {
          expect(a).to.be.eq(instaAccountV2DefaultImplSigsV2[i])
        })
      })

      it("Should remove InstaDefaultImplementationV2 sigs to mapping.", async function () {
        const tx = await implementationsMapping.connect(masterSigner).removeImplementation(instaAccountV2DefaultImplV2.address);
        await tx.wait()
        expect(await implementationsMapping.getSigImplementation(instaAccountV2DefaultImplSigsV2[0])).to.be.equal(address_zero);
        expect((await implementationsMapping.getImplementationSigs(instaAccountV2DefaultImplV2.address)).length).to.be.equal(0);
      })

      it("Should return default imp.", async function () {
        expect(await implementationsMapping.getImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2DefaultImpl.address);
      })

      after(async () => {
        const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs);
        await tx.wait()
      })

    })
})