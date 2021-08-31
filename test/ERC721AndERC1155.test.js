const { expect } = require("chai");
const hre = require("hardhat");
const { web3, deployments, waffle } = hre;
const { provider, deployContract } = waffle

const deployContracts = require("../scripts/deployContracts")

const getMasterSigner = require("../scripts/getMasterSigner")

const defaultTest2 = require("../artifacts/contracts/v2/accounts/test/implementation_default.v2.test.sol/InstaDefaultImplementationV2.json");
const { ethers } = require("hardhat");

const { abi: ERC721Abi } = require("@openzeppelin/contracts/build/contracts/IERC721.json");
const { abi: ERC1155Abi } = require("@openzeppelin/contracts/build/contracts/IERC1155.json");
const ERC721_CONTRACT_ADDR = "0x4d695c615a7aacf2d7b9c481b66045bb2457dfde";
const ERC721_HOLDER_ADDR = "0x8c6b10d42ff08e56133fca0dac75e1931b1fcc23";
const ERC721_ID = "38"

const ERC1155_CONTRACT_ADDR = "0x1ca3262009b21F944e6b92a2a88D039D06F1acFa";
const ERC1155_OWNER = "0x76df7482f201378121da29ba4d3883176a468bf4";
const ERC1155_ID = "5"

describe("NFT-Transfer", function () {
    const address_zero = "0x0000000000000000000000000000000000000000"

    let
        instaConnectorsV2,
        implementationsMapping,
        instaAccountV2Proxy,
        instaAccountV2ImplM1,
        instaAccountV2ImplM2,
        instaAccountV2DefaultImpl,
        instaAccountV2DefaultImplV2,
        instaIndex

    let masterSigner;

    before(async () => {
        this.timeout = 10000000;
        const result = await deployContracts()
        instaAccountV2DefaultImpl = result.instaAccountV2DefaultImpl
        instaIndex = result.instaIndex
        instaConnectorsV2 = result.instaConnectorsV2
        implementationsMapping = result.implementationsMapping
        instaAccountV2Proxy = result.instaAccountV2Proxy
        instaAccountV2ImplM1 = result.instaAccountV2ImplM1
        instaAccountV2ImplM2 = result.instaAccountV2ImplM2

        masterSigner = await getMasterSigner();

        instaAccountV2DefaultImplV2 = await deployContract(masterSigner, defaultTest2, [])
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

        it("Should add InstaAccountV2 in Index.sol", async function () {
            const tx = await instaIndex.connect(masterSigner).addNewAccount(instaAccountV2Proxy.address, address_zero, address_zero)
            await tx.wait()
            expect(await instaIndex.account(2)).to.be.equal(instaAccountV2Proxy.address);
        });

    });

    describe("Should transfer NFT successfully", () => {
        let ERC721Contract;
        let ERC721Owner;
        let ERC1155Contract, ERC1155Owner;
        before(async () => {
            this.timeout = 100000000;
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [ERC1155_OWNER],
            });

            await network.provider.send("hardhat_setBalance", [
                ERC1155_OWNER,
                "0x1000000000000000",
            ]);

            // get tokenOwner
            ERC1155Owner = await ethers.getSigner(
                ERC1155_OWNER
            );
            ERC1155Contract = await ethers.getContractAt(ERC1155Abi, ERC1155_CONTRACT_ADDR, ERC1155_OWNER);

            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [ERC721_HOLDER_ADDR],
            });

            // get tokenOwner
            ERC721Owner = await ethers.getSigner(
                ERC721_HOLDER_ADDR
            );
            ERC721Contract = await ethers.getContractAt(ERC721Abi, ERC721_CONTRACT_ADDR, ERC721Owner);
        });

        it("should transfer NFT successfully", async () => {
            let account = await instaIndex.account(2)
            await ERC721Contract["safeTransferFrom(address,address,uint256)"](ERC721Owner.address, account, ERC721_ID);
            let accountBalance = await ERC721Contract.balanceOf(account);
            expect(accountBalance.toNumber()).equal(1);
        });

        it("should transfer ERC1155 successfully", async () => {
            let account = await instaIndex.account(2)
            await ERC1155Contract["safeTransferFrom(address,address,uint256,uint256,bytes)"](ERC1155_OWNER, account, ERC1155_ID, "1", ethers.utils.arrayify("0x01"));
            let accountBalance = await ERC1155Contract.balanceOf(account, ERC1155_ID);
            expect(accountBalance.toNumber()).equal(1);
        });
    })
});