// const { expect } = require("chai");
// const hre = require("hardhat");
// const { ethers, web3, upgrades, tenderlyRPC } = hre;
// const { provider } = waffle

// const addAuthCast = require("../scripts/spells/addAuth.js")
// const deployConnector = require("../scripts/deployConnector")

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

// const {
//   assertUpgradeSafe,
//   assertStorageUpgradeSafe,
//   getStorageLayout,
//   fetchOrDeploy,
//   getVersion,
//   getUnlinkedBytecode,
//   Manifest,
//   getImplementationAddress,
//   getAdminAddress,
//   ValidationOptions,
//   getStorageLayoutForAddress,
// } = require('@openzeppelin/upgrades-core');





// describe("Set up V2 contracts", function() {
//   const address_zero = "0x0000000000000000000000000000000000000000"

//   const EmitEventConnectorPath = "../artifacts/contracts/v2-dev/connectors/emitEvent.sol/ConnectEmitEvent.json"
//   const ConnectV2AuthConnectorPath = "../artifacts/contracts/v2/connectors/auth.sol/ConnectV2Auth.json"
//   const instaAccountV2UserImplPath = "../artifacts/contracts/v2/accounts/Implementation_m1.sol/InstaAccountV2ImplementationM1.json"


//   let instaIndex;
//   let instaConnectors;
  
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

//   const instaAccountV2DefaultImplSigs = [
//     "switchShield(address)",
//     "enable(address)",
//     "disable(address)",
//     "isAuth(address)",
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10))

//   const instaAccountV2UserImplSigs = [
//     "cast(address[],bytes[],address)"
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10))

//   const instaAccountV2DevImplSigs = [
//     // "enableDev(address)",
//     // "disableDev(address)",
//     "castWithFlashloan(address[],bytes[],address)"
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10))

//   let postDeployHead
//   // let provider
//   let greeter

//   const wallets = provider.getWallets()
//   let [wallet0, wallet1, wallet2] = wallets

//   before(async () => {
//       // //Initialize the provider
//       // console.log(tenderlyRPC)
//       // // await tenderlyRPC.initializeFork()
//       // //Wrap the provider
//       // provider = new ethers.providers.Web3Provider(tenderlyRPC)
//       // //Set the ethers provider to the one we initialized so it targets the correct backend
//       // ethers.provider = provider

//       // const wallets = provider.getWallets()
//       // wallet0= wallets[0]
//       // wallet1= wallets[1]

//       // console.log(Object.keys(upgrades))
//       await hre.network.provider.request({
//         method: "hardhat_impersonateAccount",
//         params: [ hre.network.config.masterAddress]
//       })
      
//       instaIndex = await ethers.getContractAt("InstaIndex", hre.network.config.instaIndexAddress)
      
//       const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
//       instaConnectors = await InstaConnectorsV2.deploy();
//       await instaConnectors.deployed();

//     const InstaAccountImplementations = await ethers.getContractFactory("InstaAccountImplementations");
//     implementationMapping = await InstaAccountImplementations.deploy();
//     await implementationMapping.deployed();
    
//     // const InstaAccountImplementationProxy = await ethers.getContractFactory("InstaAccountImplementationProxy");
//     // implementationMappingProxy = await InstaAccountImplementationProxy.deploy(implementationMappingLogic.address, "0x");
//     // await implementationMappingProxy.deployed();

//     // implementationMapping = await ethers.getContractAt("InstaAccountImplementations", implementationMappingProxy.address);

//     const InstaAccountV2Proxy = await ethers.getContractFactory("InstaAccountV2Proxy");
//     instaAccountV2Proxy = await InstaAccountV2Proxy.deploy(implementationMapping.address);
//     await instaAccountV2Proxy.deployed();

//     const InstaAccountV2DevImplementation = await ethers.getContractFactory("InstaAccountV2ImplementationM2");
//     instaAccountV2DevImpl = await InstaAccountV2DevImplementation.deploy();
//     await instaAccountV2DevImpl.deployed();

//     const InstaAccountV2DefaultImplementation = await ethers.getContractFactory("InstaAccountV2DefaultImplementation");
//     instaAccountV2DefaultImpl = await InstaAccountV2DefaultImplementation.deploy();
//     await instaAccountV2DefaultImpl.deployed();

//     const InstaAccountV2DefaultImplementationV2 = await ethers.getContractFactory("InstaAccountV2DefaultImplementationV2");
//     instaAccountV2DefaultImplV2 = await InstaAccountV2DefaultImplementationV2.deploy();
//     await instaAccountV2DefaultImplV2.deployed();

//     const InstaAccountV2UserImplementation = await ethers.getContractFactory("InstaAccountV2ImplementationM1");
//     instaAccountV2UserImpl = await InstaAccountV2UserImplementation.deploy();
//     await instaAccountV2UserImpl.deployed();


//     console.log("connectors ", instaConnectors.address)
    
//     // ##########
//     masterAddressSigner = await ethers.provider.getSigner(hre.network.config.masterAddress)

//   })

//   // it("Check deployed proxy", async function() {
//   //   console.log("Proxy Address: ", proxy.address)
//   //   console.log("Implementations Contract: ", implementations.address)
//   //   console.log("Account Implemention Contract: ", accountImplemention.address)
//   // });

//   it("Should add default implementation to mapping.", async function() {
//     const tx = await implementationMapping.connect(masterAddressSigner).setDefaultImplementation(instaAccountV2DefaultImpl.address);
//     await tx.wait()
//     expect(await implementationMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
//   });

//   it("Should add instaAccountV2UserImpl sigs to mapping.", async function() {
//     const tx = await implementationMapping.connect(masterAddressSigner).addImplementation(instaAccountV2UserImpl.address, instaAccountV2UserImplSigs);
//     await tx.wait()
//     expect(await implementationMapping.getImplementation(instaAccountV2UserImplSigs[0])).to.be.equal(instaAccountV2UserImpl.address);
//   });

//   it("Should add instaAccountV2DevImpl sigs to mapping.", async function() {
//     const tx = await implementationMapping.connect(masterAddressSigner).addImplementation(instaAccountV2DevImpl.address, instaAccountV2DevImplSigs);
//     await tx.wait()
//     expect(await implementationMapping.getImplementation(instaAccountV2DevImplSigs[0])).to.be.equal(instaAccountV2DevImpl.address);
//   });

//   it("Should add InstaAccountV2Proxy in Index.sol", async function() {
//     const tx = await instaIndex.connect(masterAddressSigner).addNewAccount(instaAccountV2Proxy.address, instaConnectors.address, address_zero)
//     await tx.wait()
//     expect(await instaIndex.account(2)).to.be.equal(instaAccountV2Proxy.address);
//   });

//   it("Should build DSA v2", async function() {
//     const tx = await instaIndex.connect(wallet0).build(wallet0.address, 2, wallet0.address)
//     const dsaWalletAddress = "0xc8F3572102748a9956c2dFF6b998bd6250E3264c"
//     expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);
//     acountV2DsaWalletUser0 = await ethers.getContractAt("InstaAccountV2ImplementationM1", dsaWalletAddress);
//     acountV2DsaWalletDev0 = await ethers.getContractAt("InstaAccountV2ImplementationM2", dsaWalletAddress);
//     acountV2DsaWalletDefault0 = await ethers.getContractAt("InstaAccountV2DefaultImplementation", dsaWalletAddress);
//   });


//   it("Should new connector", async function() {
//     await deployConnector({connectorName: "authV1", contract: "ConnectV2Auth", abiPath: ConnectV2AuthConnectorPath})
//     expect(!!addresses.connectors["authV1"]).to.be.true
//     await instaConnectors.connect(masterAddressSigner).toggleConnectors([addresses.connectors["authV1"]])
//   });
  
//   it("Should add wallet2 as auth", async function() {
//       const spells = {
//       connector: "authV1",
//       method: "add",
//       args: [wallet2.address]
//       }
//       const tx = await acountV2DsaWalletDev0.connect(wallet0).castWithFlashloan(...encodeSpells([spells]), wallet1.address)
//       const receipt = await tx.wait()
//       const z = expectEvent(receipt, require(instaAccountV2UserImplPath).abi, "LogCast")
//   });

//   it("Should add wallet1 as auth", async function() {
//       const spells = {
//       connector: "authV1",
//       method: "add",
//       args: [wallet1.address]
//       }
//       const tx = await acountV2DsaWalletUser0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//       const receipt = await tx.wait()
//       const z = expectEvent(receipt, require(instaAccountV2UserImplPath).abi, "LogCast")
//   });

//   it("Should 10 send ETH to DSAWallet0", async function() {
//     await wallet0.sendTransaction({
//       to: acountV2DsaWalletUser0.address,
//       value: ethers.utils.parseEther("10")
//     });
//     // console.log(await provider.getBalance(acountV2DsaWalletUser0.address))
//     // expect(await provider.getBalance(acountV2DsaWalletUser0.address)).to.be.bignumber.equal(new BN(10 ** 19))
//     expect(Number(await provider.getBalance(acountV2DsaWalletUser0.address))).to.be.equal(Number(ethers.utils.parseEther("10")))
//   });

//   // it("Should deposit ETH in Compound from User Imp", async function() {
//   //   const initalEthBal = await provider.getBalance(acountV2DsaWalletUser0.address)
//   //   const spells = {
//   //     connector: "compound",
//   //     method: "deposit",
//   //     args: [tokensList.eth.address, ethers.utils.parseEther("1"), 0, 0]
//   //   }
//   //   const tx = await acountV2DsaWalletUser0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//   //   const receipt = await tx.wait()
//   //   const finalEthBal = await provider.getBalance(acountV2DsaWalletUser0.address)
//   //   expect(Number(initalEthBal) - Number(finalEthBal)).to.be.equal(Number(ethers.utils.parseEther("1")))
//   //   expectEvent(receipt, abis.connectors.compound, "LogDeposit")
//   // });

//   // it("Should deposit ETH in Compound from Dev Imp", async function() {
//   //   const initalEthBal = await provider.getBalance(acountV2DsaWalletUser0.address)
//   //   const spells = {
//   //     connector: "compound",
//   //     method: "deposit",
//   //     args: [tokensList.eth.address, ethers.utils.parseEther("1"), 0, 0]
//   //   }
//   //   const tx = await acountV2DsaWalletDev0.connect(wallet1).castDev(...encodeSpells([spells]), wallet1.address)
//   //   const receipt = await tx.wait()
//   //   const finalEthBal = await provider.getBalance(acountV2DsaWalletUser0.address)
//   //   expect(Number(initalEthBal) - Number(finalEthBal)).to.be.equal(Number(ethers.utils.parseEther("1")))
//   //   expectEvent(receipt, abis.connectors.compound, "LogDeposit")
//   // });

//   // it("Should Borrow DAI in Compound from Dev Imp", async function() {
//   //   const spells = {
//   //     connector: "compound",
//   //     method: "borrow",
//   //     args: [tokensList.dai.address, ethers.utils.parseEther("1000"), 0, 0]
//   //   }
//   //   const tx = await acountV2DsaWalletDev0.connect(wallet1).castDev(...encodeSpells([spells]), wallet1.address)
//   //   const receipt = await tx.wait()
//   //   expectEvent(receipt, abis.connectors.compound, "LogBorrow", {tokenAmt: ethers.utils.parseEther("1000")})
//   // });
  

//   // it("Should change default implementation to v2.", async function() {
//   //   const tx = await implementationMapping.setDefaultImplementation(instaAccountV2DefaultImplV2.address);
//   //   await tx.wait()
//   //   expect(await implementationMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImplV2.address);
//   //   expect(await acountV2DsaWalletDefault0.implementationVersion()).to.be.eq(2)
//   //   acountV2DsaWalletDefault0 = await ethers.getContractAt("InstaAccountV2DefaultImplementationV2", acountV2DsaWalletDefault0.address);

//   // });

//   // it("Should emit event from wallet1", async function() {
//   //   const spells = {
//   //     connector: "emitEvent",
//   //     method: "emitEvent",
//   //     args: []
//   //   }
//   //   const tx = await acountV2DsaWalletDev0.connect(wallet1).castDev(...encodeSpells([spells]), wallet1.address)
//   //   const receipt = await tx.wait()
//   //   expectEvent(receipt, require(EmitEventConnectorPath).abi, "LogEmitEvent")
//   // });

//   // it("Should emit event from wallet0", async function() {
//   //   const spells = {
//   //     connector: "emitEvent",
//   //     method: "emitEvent",
//   //     args: []
//   //   }
//   //   const tx = await acountV2DsaWalletUser0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//   //   const receipt = await tx.wait()
//   //   expectEvent(receipt, require(EmitEventConnectorPath).abi, "LogEmitEvent")
//   // });

//   // it("Should change shield from wallet0", async function() {
//   //   const tx = await acountV2DsaWalletDefault0.connect(wallet0).switchShield(true);
//   //   await tx.wait()
//   //   expect(await acountV2DsaWalletDefault0.shield()).to.be.true
//   // });

//   // it("Should change default implementation to v1.", async function() {
//   //   const tx = await implementationMapping.setDefaultImplementation(instaAccountV2DefaultImpl.address);
//   //   await tx.wait()
//   //   expect(await implementationMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImpl.address);
//   //   expect(await acountV2DsaWalletDefault0.implementationVersion()).to.be.eq(1)
//   //   // acountV2DsaWalletDefault0 = await ethers.getContractAt("InstaAccountV2DefaultImplementation", acountV2DsaWalletDefault0.address);

//   // });

//   // it("Should change shield from wallet0 but revert due to no function found", async function() {
//   //   await expectRevert.unspecified( acountV2DsaWalletDefault0.switchShield(true));
//   // });

//   // it("Should change default implementation to v2.", async function() {
//   //   const tx = await implementationMapping.setDefaultImplementation(instaAccountV2DefaultImplV2.address);
//   //   await tx.wait()
//   //   expect(await implementationMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImplV2.address);
//   //   expect(await acountV2DsaWalletDefault0.implementationVersion()).to.be.eq(2)
//   //   acountV2DsaWalletDefault0 = await ethers.getContractAt("InstaAccountV2DefaultImplementationV2", acountV2DsaWalletDefault0.address);

//   // });

//   // it("Should shield be true", async function() {
//   //   expect(await acountV2DsaWalletDefault0.shield()).to.be.true
//   // });

//   // it("Should change shield from wallet1", async function() {
//   //   const tx = await acountV2DsaWalletDefault0.connect(wallet1).switchShield(false);
//   //   await tx.wait()
//   //   expect(await acountV2DsaWalletDefault0.shield()).to.be.false
//   // });

// });
