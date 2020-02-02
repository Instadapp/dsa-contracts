const basicConnector = artifacts.require("basic");
const connectorsContract = artifacts.require("InstaConnectors");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount");
const listContract = artifacts.require("InstaList");
const authConnnector = artifacts.require("SmartAuth");

var abi = require('ethereumjs-abi')
const web3Helper = require('web3-abi-helper').Web3Helper;
contract("Connectors", async (accounts) => {
    const accountOne = accounts[2];
    const accountTwo = accounts[3];
    const origin = accounts[5]
    const amtToTransfer =  0.01;

    it("Deployed new SLA.(From: accountOne).", async () =>
    {
        await buildSla(accountOne, origin)
    })

    it("Deposited ETH to SLA Account using Basic connector.(From: accountOne).", async () =>
    {
        await depositETH(accountOne, amtToTransfer)
    })

    it("Balance of SLA.", async () =>
    {
        await balanceOf(accountOne, amtToTransfer)
    })

    it("Withdrawn ETH from SLA Account to accountOne.(From: accountOne).", async () =>
    {
        await withdrawETH(accountOne, accountOne, amtToTransfer)
    })

    it("Added new owner(accountTwo).(From: accountOne).", async () =>
    {
        await addOwner(accountOne, accountTwo)
    })

    it("Deposited ETH to SLA using Basic connector.(From: accountTwo).", async () =>
    {
        await depositETH(accountTwo, amtToTransfer)
    })

    it("Balance of SLA.", async () =>
    {
        await balanceOf(accountTwo, amtToTransfer)
    })

    it("Withdrawn ETH from SLA using Basic connector.(From: accountTwo).", async () =>
    {
        await withdrawETH(accountTwo, accountOne, amtToTransfer)
    })

    it("Removed owner(accountTwo).(From: accountOne).", async () =>
    {
        await removeOwner(accountOne, accountTwo)
    })
  });


async function buildSla(owner) {
    var indexInstance = await indexContract.deployed();
    await indexInstance.build(owner, owner, {from: owner});
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    var indexAddress = await accountInstance.index();
    assert.equal(indexAddress, indexInstance.address)
}

async function balanceOf(owner, amt) {
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    let balance = await web3.eth.getBalance(accountInstance.address);
    var reqBal = amt*10**18
    reqBal = reqBal.toFixed(0)
    assert.equal(balance, reqBal)
}


async function depositETH(owner, amtInDec) {
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    var ABI = {
        "inputs": [
          {
            "internalType": "address",
            "name": "erc20",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenAmt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "getId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "setId",
            "type": "uint256"
          }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    var amt = amtInDec*10**18;
    amt = amt.toFixed(0)
    var inputs = [
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amt,
        "0",
        "0"
    ]
    let encoded = web3Helper.encodeMethod(ABI, inputs);
    var castInputs = [
        [basicConnector.address],
        [encoded],
        owner
    
    ]
    
    await accountInstance.cast(...castInputs, {from: owner, value:amt})
}

async function withdrawETH(owner, withdrawETHTo, amtInDec) {
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    var ABI = {
		"inputs": [
			{
				"internalType": "address",
				"name": "erc20",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmt",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "withdrawTokenTo",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "getId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "setId",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
    var amt = amtInDec*10**18;
    amt = amt.toFixed(0)
    var inputs = [
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amt,
        withdrawETHTo,
        "0",
        "0"
    ]
    let encoded = web3Helper.encodeMethod(ABI, inputs);
    var castInputs = [
        [basicConnector.address],
        [encoded],
        owner
    
    ]
    
    await accountInstance.cast(...castInputs, {from: owner})
}

async function addOwner(owner, newOwner) {
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    var inputs = [
        newOwner
    ]
    var ABI = [{
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "addModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "removeModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }]
    var inputs = [
        newOwner
    ]
    let encoded = web3Helper.encodeMethod(ABI[0], inputs);
    var castInputs = [
        [authConnnector.address],
        [encoded],
        owner
    ]
    var isEnabled = await accountInstance.auth(newOwner)
    assert.ok(!isEnabled, "connector already enabled")
    await accountInstance.cast(...castInputs, {from: owner})
    var isEnabled = await accountInstance.auth(newOwner)
    assert.ok(isEnabled, "not able enable")
}

async function removeOwner(owner, removeOwner) {
    var slaAddr = await getSlaAddress(owner)
    var accountInstance = await accountContract.at(slaAddr);
    var ABI = [{
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "addModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "removeModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }]
    var inputs = [
        removeOwner,
    ]
    let encoded = web3Helper.encodeMethod(ABI[1], inputs);
    var castInputs = [
        [authConnnector.address],
        [encoded],
        owner
    
    ]
    var isEnabled = await accountInstance.auth(removeOwner)
    assert.ok(isEnabled, "connector was not enabled before")
    await accountInstance.cast(...castInputs, {from: owner})
    var isEnabled = await accountInstance.auth(removeOwner)
    assert.ok(!isEnabled, "not able disable")
}

async function getSlaAddress(owner) {
    var listInstance = await listContract.deployed();
    var listUserLink = await listInstance.userLink(owner);
    var slaAddr = await listInstance.accountAddr(listUserLink.last);
    return slaAddr;
}
