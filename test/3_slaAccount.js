const basicConnector = artifacts.require("basic");
const connectorsContract = artifacts.require("InstaConnectors");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount");
const listContract = artifacts.require("InstaList");
const authConnnector = artifacts.require("ConnectAuth");

const web3Helper = require('web3-abi-helper').Web3Helper;

contract("InstaAccount", async (accounts) => {
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
    var indexInstance = await indexContract.deployed(); //InstaIndex instance
    await indexInstance.build(owner, owner, {from: owner}); // Create a new SLA account for `owner` 
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
    var indexAddress = await accountInstance.index(); // get index address variable from SLA account.
    assert.equal(indexAddress, indexInstance.address)
}

async function balanceOf(owner, amt) {
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
    let balance = await web3.eth.getBalance(accountInstance.address); // Get eth bal of SLA Account.
    var reqBal = amt*10**18 //Convert to 18 decimals
    reqBal = reqBal.toFixed(0)
    assert.equal(balance, reqBal)
}


async function depositETH(owner, amtInDec) {
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
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
    var amt = amtInDec*10**18; //Convert to 18 decimals
    amt = amt.toFixed(0) //Remove if any decimals
    var inputs = [ // Inputs for `deposit()` function of connector.
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amt,
        "0",
        "0"
    ]
    let encoded = web3Helper.encodeMethod(ABI, inputs); // get calldata for `deposit()` function.
    var castInputs = [ //Inputs for `cast()` function of SLA Account.
        [basicConnector.address],
        [encoded],
        owner
    
    ]
    
    await accountInstance.cast(...castInputs, {from: owner, value:amt}) // Execute `cast()` function
}

async function withdrawETH(owner, withdrawETHTo, amtInDec) {
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
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
    var amt = amtInDec*10**18; //Convert to 18 decimals
    amt = amt.toFixed(0) //Remove if any decimals
    var inputs = [ // Inputs for `withdraw()` function of connectors.
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amt,
        withdrawETHTo,
        "0",
        "0"
    ]
    let encoded = web3Helper.encodeMethod(ABI, inputs); // get calldata for `withdraw()` function.
    var castInputs = [ //Inputs for `cast()` function of SLA Account.
        [basicConnector.address],
        [encoded],
        owner
    
    ]
    await accountInstance.cast(...castInputs, {from: owner}) // Execute `cast()` function
}

async function addOwner(owner, newOwner) {
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
    var auth = await authConnnector.deployed(); //InstaAccount(SLA account of owner) instance 
    console.log(await auth.name())
    var addOwnerABI = {
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
      }

    var inputs = [ // Inputs for `addModule()` function of connectors.
      newOwner
  ]
    let encoded = web3Helper.encodeMethod(addOwnerABI, inputs); // get calldata for `addModule()` function.
    var castInputs = [ //Inputs for `cast()` function of SLA Account.
        [authConnnector.address],
        [encoded],
        owner
    ]
    var isEnabled = await accountInstance.auth(newOwner) // Check if the given address is enabled in auth
    assert.ok(!isEnabled, "connector already enabled")
    await accountInstance.cast(...castInputs, {from: owner}) // Execute `cast()` function
    var isEnabled = await accountInstance.auth(newOwner)  // Check if the given address is enabled in auth
    assert.ok(isEnabled, "not able enable")
}

async function removeOwner(owner, removeOwner) {
    var slaAddr = await getSlaAddress(owner) //Get SLA Account address by owner.
    var accountInstance = await accountContract.at(slaAddr); //InstaAccount(SLA account of owner) instance 
    var ABI = { 
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
      }

    var inputs = [ // Inputs for `removeModule()` function of connectors.
        removeOwner,
    ]
    let encoded = web3Helper.encodeMethod(ABI, inputs); // get calldata for `removeModule()` function.
    var castInputs = [ //Inputs for `cast()` function of SLA Account.
        [authConnnector.address],
        [encoded],
        owner
    
    ]
    var isEnabled = await accountInstance.auth(removeOwner)  // Check if the given address is enabled in auth
    assert.ok(isEnabled, "connector was not enabled before")
    await accountInstance.cast(...castInputs, {from: owner}) // Execute `cast()` function
    var isEnabled = await accountInstance.auth(removeOwner)  // Check if the given address is enabled in auth
    assert.ok(!isEnabled, "Not able disable")
}

async function getSlaAddress(owner) {
    var listInstance = await listContract.deployed(); //InstaIndex instance
    var listUserLink = await listInstance.userLink(owner); // Get SLA account(IDs) using `owner`
    var slaAddr = await listInstance.accountAddr(listUserLink.last); // Get SLA Account Address using `ID`
    return slaAddr;
}
