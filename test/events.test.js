// const { expect } = require("chai");
// const hre = require("hardhat");
// const { ethers, web3 } = hre;
// const { provider } = waffle

// const addAuthCast = require("../scripts/spells/addAuth.js")
// const deployConnector = require("../scripts/deployConnector")
// const deployContracts = require("../scripts/deployContracts")

// const encodeSpells = require("../scripts/encodeSpells.js")
// const expectEvent = require("../scripts/expectEvent")

// const addresses = require("../scripts/constant/addresses");
// const abis = require("../scripts/constant/abis");

// const tokensList = require("../scripts/constant/tokens.js")

// const {
//   BN,           // Big Number support
//   constants,    // Common constants, like the zero address and largest integers
//   expectRevert, // Assertions for transactions that should fail
// } = require('@openzeppelin/test-helpers');



// describe("Set up V2 contracts", function() {
//   const address_zero = "0x0000000000000000000000000000000000000000"

//   const EmitEventConnectorPath = "../artifacts/contracts/v2-dev/connectors/emitEvent.sol/ConnectEmitEvent.json"
//   const ConnectV2AuthConnectorPath = "../artifacts/contracts/v2/connectors/auth.sol/ConnectV2Auth.json"
//   const instaAccountV2UserImplPath = "../artifacts/contracts/v2/accountImplementation/Implementation_v1.sol/InstaAccountV2ImplementationM1.json"

//   let instaIndex;
//   let instaAccountV2Proxy;
  
//   let instaAccountV2UserImpl;
//   let instaAccountV2DevImpl;
//   let instaAccountV2DefaultImpl;
//   let instaAccountV2DefaultImplV2;

//   let implementationMapping;
//   let implementationMappingLogic;
//   let implementationMappingProxy;

//   let masterAddressSigner;

//   let acountV2DsaWalletUser0;
//   let acountV2DsaWalletDefault0;
//   let acountV2DsaWalletDev0;

//   let instaAccountV2ImplM1;
//   let instaAccountV2ImplM2;

//   const wallets = provider.getWallets()
//   const [wallet0, wallet1, wallet2] = wallets

//   const instaAccountV2UserImplSigs = [
//     "cast(address[],bytes[],address)"
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10))

// //   const instaAccountV2DevImplSigs = [
// //     // "enableDev(address)",
// //     // "disableDev(address)",
// //     "castDev(address[],bytes[],address)"
// //   ].map((a) => web3.utils.keccak256(a).slice(0, 10))

//   before('', async () => {
//     const result = await deployContracts()
//         instaAccountV2DefaultImpl = result.instaAccountV2DefaultImpl
//         instaIndex = result.instaIndex
//         instaConnectorsV2 = result.instaConnectorsV2
//         implementationsMapping = result.implementationsMapping
//         instaAccountV2Proxy = result.instaAccountV2Proxy
//         instaAccountV2ImplM1 = result.instaAccountV2ImplM1
//         instaAccountV2ImplM2 = result.instaAccountV2ImplM2

//         masterAddressSigner = await getMasterSigner()

//   })

//     // it("Check deployed proxy", async function() {
//     //   console.log("Proxy Address: ", proxy.address)
//     //   console.log("Implementations Contract: ", implementations.address)
//     //   console.log("Account Implemention Contract: ", accountImplemention.address)
//     // });

//     it("Should add default implementation to mapping.", async function() {
//         const tx = await implementationMapping.connect(masterAddressSigner).setDefaultImplementation(instaAccountV2DefaultImpl.address);
//         await tx.wait()
//         expect(await implementationMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
//     });

//     it("Should add instaAccountV2UserImpl sigs to mapping.", async function() {
//         const tx = await implementationMapping.addImplementation(instaAccountV2UserImpl.address, instaAccountV2UserImplSigs);
//         await tx.wait()
//         expect(await implementationMapping.getImplementation(instaAccountV2UserImplSigs[0])).to.be.equal(instaAccountV2UserImpl.address);
//     });

//     it("Should add InstaAccountV2Proxy in Index.sol", async function() {
//         const tx = await instaIndex.connect(masterAddressSigner).addNewAccount(instaAccountV2Proxy.address, address_zero, address_zero)
//         await tx.wait()
//         expect(await instaIndex.account(2)).to.be.equal(instaAccountV2Proxy.address);
//     });

//     it("Should build DSA v2", async function() {
//         const tx = await instaIndex.connect(wallet0).build(wallet0.address, 2, wallet0.address)
//         const dsaWalletAddress = "0xc8F3572102748a9956c2dFF6b998bd6250E3264c"
//         expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);
//         acountV2DsaWalletUser0 = await ethers.getContractAt("InstaAccountV2ImplementationM1", dsaWalletAddress);
//     });

//     it("Should new connector", async function() {
//         await deployConnector({connectorName: "authV1", contract: "ConnectV2Auth", abiPath: ConnectV2AuthConnectorPath})
//         expect(!!addresses.connectors["authV1"]).to.be.true
//     });

//     it("Should emit event from wallet1", async function() {
//         const spells = {
//         connector: "authV1",
//         method: "add",
//         args: [wallet1.address]
//         }
//         const tx = await acountV2DsaWalletUser0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//         const receipt = await tx.wait()
//         expectEvent(receipt, require(instaAccountV2UserImplPath).abi, "LogSpells")
//     });
// });
