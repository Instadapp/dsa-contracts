const { expect } = require("chai");
const hre = require("hardhat");
const { web3 } = hre;

const deployContracts = require("../scripts/deployContracts")

const getMasterSigner = require("../scripts/getMasterSigner")

describe("Test Implementations.sol", function() {
  const address_zero = "0x0000000000000000000000000000000000000000"

  let
    instaConnectorsV2,
    implementationsMapping,
    instaAccountV2Proxy,
    instaAccountV2ImplM1,
    instaAccountV2ImplM2,
    instaAccountV2DefaultImpl

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

  it("Should have contracts deployed.", async function() {
    expect(!!instaConnectorsV2.address).to.be.true;
    expect(!!implementationsMapping.address).to.be.true;
    expect(!!instaAccountV2Proxy.address).to.be.true;
    expect(!!instaAccountV2ImplM1.address).to.be.true;
    expect(!!instaAccountV2ImplM2.address).to.be.true;
  });

  it("Should add default implementation to mapping.", async function() {
    const tx = await implementationsMapping.connect(masterSigner).setDefaultImplementation(instaAccountV2DefaultImpl.address);
    await tx.wait()
    expect(await implementationsMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
  });

  it("Should add instaAccountV2ImplM1 sigs to mapping.", async function() {
    const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM1.address, instaAccountV2ImplM1Sigs);
    await tx.wait()
    expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM1Sigs[0])).to.be.equal(instaAccountV2ImplM1.address);
    (await implementationsMapping.getImplementationSigs(instaAccountV2ImplM1.address)).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2ImplM1Sigs[i])
    })
  });

  it("Should add instaAccountV2ImplM2 sigs to mapping.", async function() {
    const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaAccountV2ImplM2.address, instaAccountV2ImplM2Sigs);
    await tx.wait()
    expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2ImplM2.address);
    (await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).forEach((a, i) => {
        expect(a).to.be.eq(instaAccountV2ImplM2Sigs[i])
    })
  });

  it("Should remove instaAccountV2ImplM2 sigs to mapping.", async function() {
    const tx = await implementationsMapping.connect(masterSigner).removeImplementation(instaAccountV2ImplM2.address);
    await tx.wait()
    expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(address_zero);
    expect((await implementationsMapping.getImplementationSigs(instaAccountV2ImplM2.address)).length).to.be.equal(0);
  });

  it("Should return default imp.", async function() {
    expect(await implementationsMapping.getImplementation(instaAccountV2ImplM2Sigs[0])).to.be.equal(instaAccountV2DefaultImpl.address);
  });

  // TODO @thrilok209 : Add more test cases
//   it("Should change default implementation to mapping.", async function() {
//     const tx = await implementationsMapping.connect(masterSigner).setDefaultImplementation(instaAccountV2DefaultImpl.address);
//     await tx.wait()
//     expect(await implementationsMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
//   });
});
