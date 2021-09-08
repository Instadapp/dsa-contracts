const { ethers } = require("hardhat");
const impersonateAccounts = require("./impersonate");
const tokenABI = [{
  "inputs": [
    {
      "internalType": "address",
      "name": "recipient",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  "name": "transfer",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "_to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "_amount",
      "type": "uint256"
    }
  ],
  "name": "mint",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "constant": false,
  "inputs": [{ "name": "amount", "type": "uint256" }],
  "name": "issue", "outputs": [],
  "payable": false,
  "stateMutability": "nonpayable",
  "type": "function"
}];

const mineTx = async (tx) => {
  await (await tx).wait();
};

const tokenMapping = {
  usdc: {
    impersonateSigner: "0x4A208828484DD90C14e02bE7e670C17C6C71cAc3",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    abi: tokenABI,
    process: async function (owner, to, amt) {
      const contract = new ethers.Contract(this.address, this.abi, owner);

      await mineTx(contract.mint(to, amt));
    },
  },
  dai: {
    impersonateSigner: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503",
    abi: tokenABI,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    process: async function (owner, to, amt) {
      const contract = new ethers.Contract(this.address, this.abi, owner);
      await mineTx(contract.transfer(to, amt));
    },
  },
  usdt: {
    impersonateSigner: "0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    abi: [
      "function issue(uint amount)",
      "function transfer(address to, uint value)",
    ],
    process: async function (owner, address, amt) {
      const contract = new ethers.Contract(this.address, this.abi, owner);

      await mineTx(contract.issue(amt));
      await mineTx(contract.transfer(address, amt));
    },
  },
  wbtc: {
    impersonateSigner: "0xCA06411bd7a7296d7dbdd0050DFc846E95fEBEB7",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    abi: ["function mint(address _to, uint256 _amount) public returns (bool)"],
    process: async function (owner, address, amt) {
      const contract = new ethers.Contract(this.address, this.abi, owner);
      await mineTx(contract.mint(address, amt));
    },
  },
};

module.exports = async (tokenName, address, amt) => {
  const [signer] = await ethers.getSigners();
  tokenName = tokenName.toLowerCase();
  if (!tokenMapping[tokenName]) {
    throw new Error(
      "Add liquidity doesn't support the following token: ",
      tokenName
    );
  }

  const token = tokenMapping[tokenName];

  const [impersonatedSigner] = await impersonateAccounts([
    token.impersonateSigner,
  ]);

  // send 1 eth to cover any tx costs.
  await signer.sendTransaction({
    to: impersonatedSigner.address,
    value: ethers.utils.parseEther("1"),
  });

  await token.process(impersonatedSigner, address, amt);
};
