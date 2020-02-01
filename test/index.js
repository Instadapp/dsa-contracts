const connectorsContract = artifacts.require("InstaConnectors");
const listContract = artifacts.require("InstaList");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount")


contract("WalletRegistry", async (accounts) => {
    const masterOne = accounts[0];
    const masterTwo = accounts[1];
    const slaAccountOne = accounts[2];
    const slaAccountTwo = accounts[3];
    const checkOne = accounts[4];
    const checkTwo = accounts[5];

    it("Accounts Contract deployed.", async () =>
    {
        await getRegistryDetails()
    })

    it("Accounts Contract's index variable is index contract address.", async () =>
    {
        await getAccountIndexAddress()
    })

    it("Master is masterOne.", async () =>
    {
        await getMasterDetail(masterOne)
    })

    it("Check changed.(from: checkOne, to: checkTwo, by:masterOne)", async () =>
    {
        await changeCheck(masterOne, checkTwo)
    })

    it("Master changed.(from: masterOne, to: masterTwo)", async () =>
    {
        await changeMaster(masterOne, masterTwo)
    })

    it("Check changed.(from: checkTwo, to: checkOne, by:masterTwo)", async () =>
    {
        await changeCheck(masterTwo, checkOne)
    })

    it("Master Changed.(From: masterTwo, to: masterOne)", async () =>
    {   
        await changeMaster(masterTwo, masterOne)
    })

    it("SLA created for slaAccountOne", async () =>
    {
        await createSLA(slaAccountOne, accounts)
    })

    it("Multiple SLA created for slaAccontTwo", async () =>
    {
        await createMultiSLA(slaAccountTwo)
    })

    it("Master is masterOne.", async () =>
    {
        await getMasterDetail(masterOne)
    })
    


  });

async function getRegistryDetails() {
    var indexInstance = await indexContract.deployed();
    var SLAaddr = await indexInstance.account();
    assert.notEqual(SLAaddr, "0x0000000000000000000000000000000000000000")
}

async function getAccountIndexAddress() {
    var indexInstance = await indexContract.deployed();
    var accountInstance = await accountContract.deployed();
    var indexAddress = await accountInstance.index();
    assert.equal(indexAddress, indexInstance.address)
}


async function getMasterDetail(master) {
    var indexInstance = await indexContract.deployed();
    var smartMasteraddr = await indexInstance.master();
    assert.equal(smartMasteraddr, master)
}

async function changeMaster(master, nextAdmin) {
    var indexInstance = await indexContract.deployed();
    await indexInstance.changeMaster(nextAdmin, {from: master});
    var smartMasteraddr = await indexInstance.master();
    assert.equal(smartMasteraddr, nextAdmin)
    assert.notEqual(smartMasteraddr, master)
}

async function changeCheck(master, nextCheckAddr) {
    var indexInstance = await indexContract.deployed();
    await indexInstance.changeCheck(nextCheckAddr, {from: master});
    var checkAddr = await indexInstance.check();
    assert.equal(checkAddr, nextCheckAddr)
}

async function createSLA(owner, accounts) {
    var indexInstance = await indexContract.deployed();
    var listInstance = await listContract.deployed();
    await indexInstance.build(owner, owner, {from: owner});
    
    var slaOwnerLink = await listInstance.userLink(owner);
    // var slaFirstOwner = await listInstance.FirstOwner(slaAddr)
    // assert.equal(slaFirstOwner, owner);
    
    var slaAddr = await listInstance.accountAddr(Number(slaOwnerLink.first))
    var slaInstance = await accountContract.at(slaAddr);
    var isOwner = await slaInstance.auth(owner);
    assert.ok(isOwner);
}

async function createMultiSLA(owner) {
    var indexInstance = await indexContract.deployed();
    var listInstance = await listContract.deployed();
    await indexInstance.build(owner, owner, {from: owner});
    await indexInstance.build(owner, owner, {from: owner});
    await indexInstance.build(owner, owner, {from: owner});
    
    var slaOwnerLink = await listInstance.userLink(owner);
    assert.notEqual(slaOwnerLink.count, 0);
    
}

function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }