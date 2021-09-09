const { expect } = require("chai");
const hre = require("hardhat");
const { web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle

const deployContracts = require("../scripts/getAndDeployContracts")
const deployConnector = require("../scripts/deployConnector")

const encodeSpells = require("../scripts/encodeSpells.js")

const getMasterSigner = require("../scripts/getMasterSigner")

const addresses = require("../scripts/constant/addresses");

const addLiquidity = require("../scripts/addLiquidity");

const erc20 = require("../artifacts/contracts/v2/accounts/module2/core/interface.sol/IERC20.json");
const defaultTest2 = require("../artifacts/contracts/v2/accounts/test/implementation_default.v2.test.sol/InstaDefaultImplementationV2.json");
const { ethers } = require("hardhat");

const connectorName = "COMPOUND-A"

describe("LimitOrder", function () {
    const address_zero = "0x0000000000000000000000000000000000000000"
    const ethAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    const usdcAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    const cEthAddr = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5"
    const cDaiAddr = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
    const maxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935"

    let
        instaConnectorsV2,
        implementationsMapping,
        instaAccountV2Proxy,
        instaAccountV2ImplM1,
        instaAccountV2ImplM2,
        instaAccountV2DefaultImpl,
        instaAccountV2DefaultImplV2,
        instaIndex

    const instaAccountV2ImplM1Sigs = [
        "cast(string[],bytes[],address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))

    const instaAccountV2ImplM2Sigs = [
        "castWithFlashloan(string[],bytes[],address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))

    const instaAccountV2ImplModuleSigs = [
        "castLimitOrder(address,address,uint256,uint256,uint32,address,address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))

    // const instaAccountV2ImplModuleSigs = ["0x5b3a540e"];

    let masterSigner;

    let acountV2DsaM1Wallet0;

    let compound, basic;
    let limitOrderContract;
    let adminContract;
    let instaImplementationM2;

    const wallets = provider.getWallets()
    let [wallet0] = wallets

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

        await network.provider.send("hardhat_setBalance", [
            masterSigner._address,
            "0x1000000000000000",
        ]);

        instaAccountV2DefaultImplV2 = await deployContract(masterSigner, defaultTest2, [])

        const LimitOrderContract = await ethers.getContractFactory("DeFiLimitOrder")
        limitOrderContract = await LimitOrderContract.deploy();
        await limitOrderContract.deployed();
        console.log("Limit order contract deployed to:", limitOrderContract.address);
        const AdminContract = await ethers.getContractFactory("Admin")
        adminContract = await AdminContract.deploy();
        await adminContract.deployed();
        console.log("Admin contract deployed to:", adminContract.address);
        const InstaImplementationM2 = await ethers.getContractFactory("InstaImplementationM2Module");
        instaImplementationM2 = await InstaImplementationM2.deploy(limitOrderContract.address);
        await instaImplementationM2.deployed();
        console.log("Implementation contract deployed to:", instaImplementationM2.address);
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

        it("Should add instaAccountV2ImplModule sigs to mapping.", async function () {
            const tx = await implementationsMapping.connect(masterSigner).addImplementation(instaImplementationM2.address, instaAccountV2ImplModuleSigs);
            await tx.wait()
            expect(await implementationsMapping.getSigImplementation(instaAccountV2ImplModuleSigs[0])).to.be.equal(instaImplementationM2.address);
            (await implementationsMapping.getImplementationSigs(instaImplementationM2.address)).forEach((a, i) => {
                expect(a).to.be.eq(instaAccountV2ImplModuleSigs[i])
            })
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
            const receipt = await tx.wait();
            const events = receipt.events
            const dsaWalletAddress = "0x91F9F2509270AfB3fF443d62E1498e755198117f"
            expect((await tx.wait()).events[1].args.account).to.be.equal(dsaWalletAddress);
            acountV2DsaM1Wallet0 = await ethers.getContractAt("InstaImplementationM1", dsaWalletAddress);
            acountV2DsaM2Wallet0 = await ethers.getContractAt("InstaImplementationM2", dsaWalletAddress);
            acountV2DsaDefaultWallet0 = await ethers.getContractAt("InstaDefaultImplementation", dsaWalletAddress);
            acountV2DsaDefaultWalletM2 = await ethers.getContractAt("InstaDefaultImplementationV2", dsaWalletAddress);
            accountV2DsaM2ModuleWallet0 = await ethers.getContractAt("InstaImplementationM2Module", dsaWalletAddress);
            await addLiquidity("dai", dsaWalletAddress, ethers.utils.parseEther("1000"));
        });

        it("Should deploy Auth connector", async function () {
            const connectorName = "authV2"
            await deployConnector({
                connectorName,
                contract: "ConnectV2Auth",
                abi: (await deployments.getArtifact("ConnectV2Auth")).abi
            })
            expect(!!addresses.connectors["authV2"]).to.be.true
            const tx = await instaConnectorsV2.connect(masterSigner).addConnectors(["authV2"], [addresses.connectors["authV2"]])
            const receipt = await tx.wait()
            const events = receipt.events
            expect(events[0].args.connectorNameHash).to.be.eq(web3.utils.keccak256(connectorName));
            expect(events[0].args.connectorName).to.be.eq(connectorName);
        });

        it("Should add limitOrderContract as auth", async function () {
            const spells = {
                connector: "authV2",
                method: "add",
                args: [acountV2DsaM1Wallet0.address]
            }
            const tx = await acountV2DsaM1Wallet0.connect(wallet0).cast(...encodeSpells([spells]), acountV2DsaM1Wallet0.address)
            const receipt = await tx.wait()
        });

        it("Should change default implementation", async function () {
            const tx = await implementationsMapping.connect(masterSigner).setDefaultImplementation(instaAccountV2DefaultImplV2.address);
            await tx.wait()
            expect(await implementationsMapping.defaultImplementation()).to.be.equal(instaAccountV2DefaultImplV2.address);
        });
    });

    describe("Connectors", function () {
        before(async function () {
            compound = await deployConnector({
                connectorName,
                contract: "ConnectV2Compound",
                abi: (await deployments.getArtifact("ConnectV2Compound")).abi
            });
        });

        it("Deposit ETH into DSA wallet", async function () {
            await wallet0.sendTransaction({
                to: acountV2DsaM1Wallet0.address,
                value: ethers.utils.parseEther("10")
            });
            expect(await ethers.provider.getBalance(acountV2DsaM1Wallet0.address)).to.be.gte(ethers.utils.parseEther("10"));
        });

        it("Should deposit ETH & DAI to compound", async function () {
            const spells = [
                {
                    connector: connectorName,
                    method: "deposit",
                    args: ["ETH-A", ethers.utils.parseEther("1"), 0, 0]
                },
                {
                    connector: connectorName,
                    method: "deposit",
                    args: ["DAI-A", ethers.utils.parseEther("1"), 0, 0]
                }
            ]

            const tx = await acountV2DsaM1Wallet0.connect(wallet0).cast(...encodeSpells(spells), wallet0.address)
            const receipt = await tx.wait()
        });
    });

    describe("Create order and swap successfully", function () {
        it("Should create Order successfully", async function () {
            const dsaWalletAddress = "0x91F9F2509270AfB3fF443d62E1498e755198117f"
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [dsaWalletAddress],
            });

            await network.provider.send("hardhat_setBalance", [
                dsaWalletAddress,
                "0x1000000000000000",
            ]);

            // get tokenOwner
            const dsaWallet = await ethers.getSigner(
                dsaWalletAddress
            );

            const baseTx = await limitOrderContract.connect(wallet0).toggleRoute(1);
            await baseTx.wait();
            const cTokenTx = await limitOrderContract.connect(wallet0).updateTokenToCtokenMap([ethAddr, daiAddr], [cEthAddr, cDaiAddr]);
            await cTokenTx.wait();
            const routeTokens = await limitOrderContract.connect(wallet0).updateRouteTokens(1, [ethAddr, daiAddr]);
            await routeTokens.wait();
            const tx = await limitOrderContract.connect(dsaWallet)['create(address,address,uint128,uint32)'](ethAddr, daiAddr, "3300", 1);
            await tx.wait();
        })

        it("Should sell successfully", async function () {
            const dsaWalletAddress = "0x91F9F2509270AfB3fF443d62E1498e755198117f"
            const dsaWallet = await ethers.getSigner(
                dsaWalletAddress
            );
            
            const daiContract = await ethers.getContractAt(erc20.abi, daiAddr);
            const approveTx = await daiContract.connect(dsaWallet).approve(limitOrderContract.address, ethers.utils.parseEther("330"));
            await approveTx.wait();

            const orderId = await limitOrderContract.connect(dsaWallet).encodeDsaKey(dsaWallet.address, 1);

            const castTx = await limitOrderContract.connect(dsaWallet)['sell(address,address,uint256,uint256,bytes8,address)'](daiAddr, ethAddr, "3300", "1", orderId, dsaWallet.address);
            await castTx.wait()
        });
    });
});