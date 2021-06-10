const { expect } = require("chai");
const getMasterSigner = require("../scripts/getMasterSigner");
const hre = require("hardhat");
const deployDSAv2 = require("../scripts/deployDSAv2");
const getDeployedContacts = require("../scripts/getDeployedContracts");
const { ethers, web3 } = hre;
const encodeSpells = require("../scripts/encodeSpells.js");

describe("Flashloan Core", () => {
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const maxValue =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";
  const instaAccountV2ImplM2Sigs = [
    "cast(string[],bytes[],address,uint256,uint256,address)",
    "flashCallback(address,address,uint256,string[],bytes[],address)",
  ].map((sig) => web3.utils.keccak256(sig).slice(0, 10));
  let accountV2ImplM2;
  let instaIndex;
  let wallet, masterSigner;
  let accountDSAM2Wallet;
  let deployedContracts;
  let implementationsMapping;
  let _instaAccountV2ImplM2;
  let origin;

  before(async () => {
    [wallet] = await ethers.getSigners();
    origin = wallet.address;
    deployedContracts = await getDeployedContacts();
    implementationsMapping = deployedContracts["InstaImplementations"];

    instaIndex = await ethers.getContractAt(
      "InstaIndex",
      hre.network.config.instaIndexAddress
    );

    masterSigner = await getMasterSigner();
    const InstaImplementationM2 = await ethers.getContractFactory(
      "InstaImplementationM2"
    );
    _instaAccountV2ImplM2 = await InstaImplementationM2.deploy(
      "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723",
      "0x97b0B3A8bDeFE8cB9563a3c610019Ad10DB8aD11",
      "0x2a1739d7f07d40e76852ca8f0d82275aa087992f"
    );
    await _instaAccountV2ImplM2.deployed();
    console.log("instaAccountV2ImplM2", _instaAccountV2ImplM2.address);
  });

  describe("test Implementation M2", () => {
    it("It should deploy dsa v2", async function () {
      const dsa = await deployDSAv2({
        instaIndex,
        owner: wallet,
        origin: wallet,
        implementations: ["InstaImplementationM2"],
      });
      accountDSAM2Wallet = dsa["InstaImplementationM2"];

      // send some eth to dsa wallet
      const amt = ethers.utils.parseEther("1");
      await wallet.sendTransaction({
        value: amt,
        to: accountDSAM2Wallet.address,
      });
    });

    it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
      const tx = await implementationsMapping
        .connect(masterSigner)
        .addImplementation(
          _instaAccountV2ImplM2.address,
          instaAccountV2ImplM2Sigs
        );
      await tx.wait();
    });

    it("Should enable sigs in the instapool", async function () {
      const abi = ["function whitelistSigs(bytes4[], bool[])"];
      const instaPoolContract = new ethers.Contract(
        "0x2a1739d7f07d40e76852ca8f0d82275aa087992f",
        abi,
        masterSigner
      );

      const tx = await instaPoolContract.whitelistSigs(
        [instaAccountV2ImplM2Sigs[1]],
        [true]
      );

      await tx.wait();
    });

    it("Cast ETH with Flashloan - Compound", async () => {
      const amt = ethers.utils.parseEther("100");
      const spells = [
        {
          connector: "COMPOUND-A",
          method: "deposit",
          args: ["ETH-A", maxValue, 0, 12122],
        },
        {
          connector: "COMPOUND-A",
          method: "withdraw",
          args: ["ETH-A", 0, 12122, 0],
        },
      ];

      const promise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        ethAddr,
        amt,
        0,
        origin
      );

      await expect(promise)
        .to.emit(accountDSAM2Wallet, "LogFlashCast")
        .withArgs(origin, ethAddr, amt, 0); // use dydx hence route is 0
    });

    it("Cast DAI with Flashloan on Compound (flashloan via dydx)", async () => {
      // So according to etherscan, dydx usually has 26M DAI
      // let's send a little below that aroudn 20M?
      let amt = ethers.utils.parseEther("20000000");
      const route = 0; // dydx
      const spells = [
        {
          connector: "COMPOUND-A",
          method: "deposit",
          args: ["DAI-A", maxValue, 0, 12122],
        },
        {
          connector: "COMPOUND-A",
          method: "withdraw",
          args: ["DAI-A", 0, 12122, 0],
        },
      ];

      let txPromise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        daiAddr,
        amt,
        route,
        wallet.address
      );

      await expect(txPromise)
        .to.emit(accountDSAM2Wallet, "LogFlashCast")
        .withArgs(origin, daiAddr, amt, route); // uses dydx hence route is 0

      // should revert on higher liquidity
      txPromise = accountDSAM2Wallet.cast(
        ...encodeSpells(spells),
        daiAddr,
        amt.mul(2), // multiply 20m with 2 = 40M, >dydx liquidity
        route,
        wallet.address
      );

      await expect(txPromise).to.revertedWith("Dai/insufficient-balance");
    });

    const routes = ["maker", "compound", "aave"];

    for (let i = 0; i < routes.length; i++) {
      it(`Cast DAI with Flashloan on Compound (flashloan via ${routes[i]})`, async () => {
        const route = i + 1;
        const amt = ethers.utils.parseEther("50000000");
        const spells = [
          {
            connector: "COMPOUND-A",
            method: "deposit",
            args: ["DAI-A", maxValue, 0, 12122],
          },
          {
            connector: "COMPOUND-A",
            method: "withdraw",
            args: ["DAI-A", 0, 12122, 0],
          },
        ];

        const promise = accountDSAM2Wallet.cast(
          ...encodeSpells(spells),
          daiAddr,
          amt,
          route,
          wallet.address
        );

        await expect(promise)
          .to.emit(accountDSAM2Wallet, "LogFlashCast")
          .withArgs(origin, daiAddr, amt, route);
      });
    }
  });
});

// const { expect } = require("chai");
// const hre = require("hardhat");
// const { web3, deployments, waffle } = hre;
// const { provider, deployContract } = waffle;

// const deployContracts = require("../scripts/deployContracts");
// const deployConnector = require("../scripts/deployConnector");
// const enableConnector = require("../scripts/enableConnector");

// const expectEvent = require("../scripts/expectEvent");

// const addresses = require("../scripts/constant/addresses");
// const abis = require("../scripts/constant/abis");

// const compoundArtifact = require("../artifacts/contracts/v2/connectors/test/compound.test.sol/ConnectCompound.json");
// const connectAuth = require("../artifacts/contracts/v2/connectors/test/auth.test.sol/ConnectV2Auth.json");
// const defaultTest2 = require("../artifacts/contracts/v2/accounts/test/implementation_default.v2.test.sol/InstaDefaultImplementationV2.json");
// const { ethers } = require("hardhat");

// describe("Core", function () {
//   const address_zero = "0x0000000000000000000000000000000000000000";
//   const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
//   const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
//   const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
//   const cEthAddr = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
//   const cDaiAddr = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
//   const maxValue =
//     "115792089237316195423570985008687907853269984665640564039457584007913129639935";

//   let deployedContracts;
//   let instaConnectorsV2,
//     implementationsMapping,
//     instaAccountV2Proxy,
//     instaAccountV2ImplM1,
//     instaAccountV2ImplM2,
//     instaAccountV2DefaultImpl,
//     instaAccountV2DefaultImplV2,
//     instaIndex;

//   const instaAccountV2DefaultImplSigs = [
//     "enable(address)",
//     "disable(address)",
//     "isAuth(address)",
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10));

//   const instaAccountV2DefaultImplSigsV2 = [
//     "enable(address)",
//     "disable(address)",
//     "isAuth(address)",
//     "switchShield(bool",
//     "shield()",
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10));

//   const instaAccountV2ImplM1Sigs = ["cast(string[],bytes[],address)"].map((a) =>
//     web3.utils.keccak256(a).slice(0, 10)
//   );

//   const instaAccountV2ImplM2Sigs = [
//     "castWithFlashloan(string[],bytes[],address)",
//   ].map((a) => web3.utils.keccak256(a).slice(0, 10));

//   let masterSigner;

//   let acountV2DsaM1Wallet0;
//   let acountV2DsaM2Wallet0;
//   let acountV2DsaDefaultWallet0;
//   let acountV2DsaDefaultWalletM2;

//   let authV3, authV4, compound, compound2;
//   let wallet0;

//   before(async () => {
//     [wallet0] = await ethers.getSigners();
//     deployedContracts = await getDeployedContacts();

//     instaIndex = await ethers.getContractAt(
//       "InstaIndex",
//       hre.network.config.instaIndexAddress
//     );

//     masterSigner = await getMasterSigner();
//   });

//   //   it("Should have contracts deployed.", async function () {
//   //     expect(!!instaConnectorsV2.address).to.be.true;
//   //     expect(!!implementationsMapping.address).to.be.true;
//   //     expect(!!instaAccountV2Proxy.address).to.be.true;
//   //     expect(!!instaAccountV2ImplM1.address).to.be.true;
//   //     expect(!!instaAccountV2ImplM2.address).to.be.true;
//   //   });

//   describe("Implementations", function () {
//     it("It should deploy contract", async function () {
//       [acountV2DsaM1Wallet0, acountV2DsaM2Wallet0] = await deployDSAv2({
//         instaIndex,
//         owner: wallet0,
//         implementations: ["InstaImplementationM1", "InstaImplementationM2"],
//       });
//       console.log(acountV2DsaM1Wallet0);
//     });

// it("Should add instaAccountV2ImplM2 sigs to mapping.", async function () {
//   const tx = await implementationsMapping
//     .connect(masterSigner)
//     .addImplementation(
//       instaAccountV2ImplM2.address,
//       instaAccountV2ImplM1Sigs
//     );
//   await tx.wait();
//   expect(
//     await implementationsMapping.getSigImplementation(
//       instaAccountV2ImplM1Sigs[0]
//     )
//   ).to.be.equal(instaAccountV2ImplM1.address);
//   (
//     await implementationsMapping.getImplementationSigs(
//       instaAccountV2ImplM1.address
//     )
//   ).forEach((a, i) => {
//     expect(a).to.be.eq(instaAccountV2ImplM1Sigs[i]);
//   });
// });
//   });

//   describe("Auth", function () {
// it("Should deploy Auth connector", async function () {
//     const connectorName = "authV2"
//     await deployConnector({
//       connectorName,
//       contract: "ConnectV2Auth",
//       abi: (await deployments.getArtifact("ConnectV2Auth")).abi
//     })
//     expect(!!addresses.connectors["authV2"]).to.be.true
//     const tx = await deployedContracts.InstaConnectorsV2.connect(masterSigner).addConnectors(["authV2"], [addresses.connectors["authV2"]])
//     const receipt = await tx.wait()
//     const events = receipt.events
//     expect(events[0].args.connectorNameHash).to.be.eq(web3.utils.keccak256(connectorName));
//     expect(events[0].args.connectorName).to.be.eq(connectorName);
//   });

//   it("Should add wallet1 as auth", async function () {
//       const spells = {
//           connector: "authV2",
//           method: "add",
//           args: [wallet1.address]
//       }
//       const tx = await acountV2DsaM1Wallet0.InstaImplementationM2.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//       const receipt = await tx.wait()
//       // const logCastEvent = expectEvent(receipt, (await deployments.getArtifact("InstaImplementationM1")).abi, "LogCast")
//       // const LogAddAuthEvent = expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
//   });

//     it("Should build DSA v2", async function () {
//       const tx = await instaIndex.connect(wallet0).build(wallet0.address, 2, wallet0.address)
//       const dsaWalletAddress = "0xC13920c134d38408871E7AF5C102894CB5180B92"
//       expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);
//       acountV2DsaM1Wallet0 = await ethers.getContractAt("InstaImplementationM1", dsaWalletAddress);
//       acountV2DsaM2Wallet0 = await ethers.getContractAt("InstaImplementationM2", dsaWalletAddress);
//       acountV2DsaDefaultWallet0 = await ethers.getContractAt("InstaDefaultImplementation", dsaWalletAddress);
//       acountV2DsaDefaultWalletM2 = await ethers.getContractAt("InstaDefaultImplementationV2", dsaWalletAddress);
//     });

//     it("Should deploy Auth connector", async function () {
//       const connectorName = "authV2"
//       await deployConnector({
//         connectorName,
//         contract: "ConnectV2Auth",
//         abi: (await deployments.getArtifact("ConnectV2Auth")).abi
//       })
//       expect(!!addresses.connectors["authV2"]).to.be.true
//       const tx = await instaConnectorsV2.connect(masterSigner).addConnectors(["authV2"], [addresses.connectors["authV2"]])
//       const receipt = await tx.wait()
//       const events = receipt.events
//       expect(events[0].args.connectorNameHash).to.be.eq(web3.utils.keccak256(connectorName));
//       expect(events[0].args.connectorName).to.be.eq(connectorName);
//     });

//     it("Should deploy EmitEvent connector", async function () {
//       const connectorName = "emitEvent"
//       await deployConnector({
//         connectorName,
//         contract: "ConnectV2EmitEvent",
//         abi: (await deployments.getArtifact("ConnectV2EmitEvent")).abi
//       })
//       expect(!!addresses.connectors["emitEvent"]).to.be.true
//       const tx = await instaConnectorsV2.connect(masterSigner).addConnectors(["emitEvent"], [addresses.connectors["emitEvent"]])
//       const receipt = await tx.wait()
//       const events = receipt.events
//       expect(events[0].args.connectorNameHash).to.be.eq(web3.utils.keccak256(connectorName));
//       expect(events[0].args.connectorName).to.be.eq(connectorName);
//     });

//     it("Should add wallet1 as auth", async function () {
//       const spells = {
//         connector: "authV2",
//         method: "add",
//         args: [wallet1.address]
//       }
//       const tx = await acountV2DsaM1Wallet0.connect(wallet0).cast(...encodeSpells([spells]), wallet1.address)
//       const receipt = await tx.wait()
//       const logCastEvent = expectEvent(receipt, (await deployments.getArtifact("InstaImplementationM1")).abi, "LogCast")
//       const LogAddAuthEvent = expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
//     });

//     it("Should add wallet2 as auth", async function () {
//       const spells = {
//         connector: "authV2",
//         method: "add",
//         args: [wallet2.address]
//       }
//       const tx = await acountV2DsaM2Wallet0.connect(wallet1).castWithFlashloan(...encodeSpells([spells]), wallet1.address)
//       const receipt = await tx.wait()
//       const logCastEvent = expectEvent(receipt, (await deployments.getArtifact("InstaImplementationM2")).abi, "LogCast")
//       const LogAddAuthEvent = expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogAddAuth")
//     });

//     it("Should remove wallet1 as auth", async function () {
//       const spells = {
//         connector: "authV2",
//         method: "remove",
//         args: [wallet1.address]
//       }
//       const tx = await acountV2DsaM1Wallet0.connect(wallet2).cast(...encodeSpells([spells]), wallet2.address)
//       const receipt = await tx.wait()
//       expectEvent(receipt, (await deployments.getArtifact("InstaImplementationM2")).abi, "LogCast")
//       expectEvent(receipt, (await deployments.getArtifact("ConnectV2Auth")).abi, "LogRemoveAuth")
//     });

//     it("Should change default implementation", async function () {
//       const tx = await implementationsMapping.connect(masterSigner).setDefaultImplementation(instaAccountV2DefaultImplV2.address);
//       await tx.wait()
//       expect(await implementationsMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImplV2.address);
//     })

//     it("Should add wallet3 as auth using default implmentation", async function() {
//       const tx = await acountV2DsaDefaultWallet0.connect(wallet0).enable(wallet3.address)
//       const receipt = await tx.wait()

//       expect(await acountV2DsaDefaultWallet0.isAuth(wallet3.address)).to.be.true
//       expectEvent(receipt, (await deployments.getArtifact("InstaDefaultImplementationV2")).abi, "LogEnableUser")
//     });

//     it("Should remove wallet0 as auth using default implmentation", async function() {
//       const tx = await acountV2DsaDefaultWallet0.connect(wallet3).disable(wallet0.address)
//       const receipt = await tx.wait()

//       expect(await acountV2DsaDefaultWallet0.isAuth(wallet0.address)).to.be.false
//       expectEvent(receipt, (await deployments.getArtifact("InstaDefaultImplementationV2")).abi, "LogDisableUser")
//     });

//     it("Should switch shield", async function () {
//       const tx = await acountV2DsaDefaultWalletM2.connect(wallet3).switchShield(true)
//       const receipt = await tx.wait()

//       expect(await acountV2DsaDefaultWalletM2.shield()).to.be.true
//       expectEvent(receipt, (await deployments.getArtifact("InstaDefaultImplementationV2")).abi, "LogSwitchShield")
//     })
//   });
// });
