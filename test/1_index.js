const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount")


contract("InstaIndex", async (accounts) => {
    let accountVersion;
     before(async() => {
        accountVersion = await getAccountVersion();
    })
    
    const masterOne = accounts[0];
    const masterTwo = accounts[1];
    const slaAccountOne = accounts[2];
    const slaAccountTwo = accounts[3];
    const checkOne = accounts[4];
    const checkTwo = accounts[5];

    it("Account.sol Contract deployed.", async () =>
    {   
        // check if account.sol contract deployed and set in index.sol
        await getRegistryDetails(accountVersion)
    })

    it("Accounts Contract's index variable is index contract address.", async () =>
    {   
        // check if account.sol contract index address is same as index.sol deployed address
        await getAccountIndexAddress()
    })

    it("Master is masterOne.", async () =>
    {
        //Get master address from index.sol and check if its masterOne
        await getMasterDetail(masterOne)
    })

    it("Check changed.(from: checkOne, to: checkTwo, by:masterOne)", async () =>
    {   
        //change check address from index.sol from checkOne to checkTwo
        await changeCheck(masterOne, checkTwo, accountVersion)
    })

    it("Master changed.(from: masterOne, to: masterTwo)", async () =>
    {   
        //change master address from index.sol from masterOne to masterTwo
        await changeMaster(masterOne, masterTwo)
    })

    it("Master Updated.(from: masterOne, to: masterTwo)", async () =>
    {   
        //change master address in index.sol to masterTwo
        await updateMaster(masterTwo, masterOne)
    })

    it("Check changed.(from: checkTwo, to: checkOne, by:masterTwo)", async () =>
    {
        //change check address in index.sol from checkTwo to checkOne
        await changeCheck(masterTwo, checkOne, accountVersion)
    })

    it("Master Changed.(From: masterTwo, to: masterTwo)", async () =>
    {   
        //change master address in index.sol from masterTwo to masterOne
        await changeMaster(masterTwo, masterOne)
    })

    it("Master Updated.(from: masterOne, to: masterTwo)", async () =>
    {   
        //change Update address in index.sol to masterOne
        await updateMaster(masterOne, masterTwo)
    })

    it("SLA created for slaAccountOne", async () =>
    {   
        //Create single SLA account
        await createSLA(slaAccountOne, accounts, accountVersion)
    })

    it("Multiple SLA created for slaAccontTwo", async () =>
    {
        //Create multi SLA account
        await createMultiSLA(slaAccountTwo, accountVersion)
    })

    it("Master is masterOne.", async () =>
    {
        await getMasterDetail(masterOne)
    })
    


  });

async function getRegistryDetails(accountVersion) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    var SLAaddr = await indexInstance.account(accountVersion); // account address from index.sol
    assert.notEqual(SLAaddr, "0x0000000000000000000000000000000000000000")
}

async function getAccountIndexAddress() {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    var accountInstance = await accountContract.deployed(); // InstaAccount instance
    var indexAddress = await accountInstance.instaIndex(); // index address variable from account.sol
    assert.equal(indexAddress, indexInstance.address)
}


async function getMasterDetail(master) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    var masterAddress = await indexInstance.master(); // master address from index.sol contract
    assert.equal(masterAddress, master)
}

async function changeMaster(master, nextAdmin) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    await indexInstance.changeMaster(nextAdmin, {from: master}); // change master address in index.sol contract
    var smartMasteraddr = await indexInstance.master(); // master address from index.sol contract
    assert.notEqual(smartMasteraddr, nextAdmin)
    assert.equal(smartMasteraddr, master)
}

async function updateMaster(master, prevMaster) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    await indexInstance.updateMaster({from: master}); // update master address in index.sol contract
    var smartMasteraddr = await indexInstance.master(); // master address from index.sol contract
    assert.equal(smartMasteraddr, master)
    assert.notEqual(smartMasteraddr, prevMaster)
}

async function changeCheck(master, nextCheckAddr, accountVersion) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    await indexInstance.changeCheck(accountVersion, nextCheckAddr, {from: master}); // change check address in index.sol contract
    var checkAddr = await indexInstance.check(accountVersion); // get 'check' address from index.sol contract
    assert.equal(checkAddr, nextCheckAddr)
}

async function createSLA(owner, accounts, accountVersion) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    var listInstance = await listContract.deployed(); // InstaList instance
    await indexInstance.build(owner, accountVersion, owner, {from: owner}); // Create a new SLA account for `owner` 
    
    var slaOwnerLink = await listInstance.userLink(owner); // get owner details of SLA(IDs)
    // var slaFirstOwner = await listInstance.FirstOwner(slaAddr)
    // assert.equal(slaFirstOwner, owner);
    
    var slaAddr = await listInstance.accountAddr(Number(slaOwnerLink.first)) // get SLA address of `owner` using ID 
    var slaInstance = await accountContract.at(slaAddr); // SLA account(owner) instance
    var isOwner = await slaInstance.isAuth(owner); // check if owner if has auth in his SLA account
    assert.ok(isOwner);
}

async function createMultiSLA(owner, accountVersion) {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    var listInstance = await listContract.deployed(); // InstaList instance
    await indexInstance.build(owner, accountVersion, owner, {from: owner}); // Create a new SLA account for `owner` 
    await indexInstance.build(owner, accountVersion, owner, {from: owner}); // Create a new SLA account for `owner` 
    await indexInstance.build(owner, accountVersion, owner, {from: owner}); // Create a new SLA account for `owner` 
    
    var slaOwnerLink = await listInstance.userLink(owner); // Get SLA Accounts details by `owner`
    assert.notEqual(slaOwnerLink.count, 0);
}

async function getAccountVersion() {
    var indexInstance = await indexContract.deployed(); // InstaIndex instance
    return await indexInstance.versionCount();
}

function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }