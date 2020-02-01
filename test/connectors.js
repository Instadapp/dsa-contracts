const basicConnector = artifacts.require("basic");
const connectorsContract = artifacts.require("InstaConnectors");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount");
const listContract = artifacts.require("InstaList");

contract("Connectors", async (accounts) => {
    const master = accounts[0];
    const cheifOne = accounts[8];
    it("Connector Contract is deployed And registred in registry.", async () =>
    {
        var indexInstance = await indexContract.deployed();
        var ConnectorsIndexAddr = await indexInstance.connectors();
        var ConnectorsAddr = await connectorsContract.deployed()
        assert.equal(ConnectorsIndexAddr, ConnectorsAddr.address)
    })

    it("Connectors Contract's index variable is index contract address.", async () =>
    {
        await getConnectorsIndexAddress()
    })

    it("Removed Basic connector.(From: master).", async () =>
    {
        await disableConnector(master, basicConnector.address)
    })

    it("Added Basic connector.(From: master).", async () =>
    {
        await enableConnector(master, basicConnector.address)
    })

    it("Removed Basic connector.(From: master).", async () =>
    {
        await disableConnector(master, basicConnector.address)
    })

    it("Added new cheif.", async () =>
    {
        await addControllor(master, cheifOne)
    })

    it("Added Basic connector.(From: cheif).", async () =>
    {
        await enableConnector(cheifOne, basicConnector.address)
    })

    // it("Removed Basic connector.(From: cheif).", async () =>
    // {
    //     await disableConnector(cheifOne, basicConnector.address)
    // })

    it("Removed cheif.", async () =>
    {
        await removeControllor(master, cheifOne)
    })
  });


async function getConnectorsIndexAddress() {
    var indexInstance = await indexContract.deployed();
    var accountInstance = await accountContract.deployed();
    var indexAddress = await accountInstance.index();
    assert.equal(indexAddress, indexInstance.address)
}

async function addControllor(cheif, cheifAddress) {
    var connectorInstance = await connectorsContract.deployed();
    var isControllorDisabled = !(await connectorInstance.chief(cheifAddress))
    assert.ok(isControllorDisabled)
    await connectorInstance.enableChief(cheifAddress, {from:cheif});
    var isControllorEnabled = await connectorInstance.chief(cheifAddress)
    assert.ok(isControllorEnabled)
}

async function removeControllor(cheif, cheifAddress) {
    var connectorInstance = await connectorsContract.deployed();
    var isControllorEnabled = await connectorInstance.chief(cheifAddress)
    assert.ok(isControllorEnabled)
    await connectorInstance.disableChief(cheifAddress, {from:cheif});
    var isControllorDisabled = !(await connectorInstance.chief(cheifAddress))
    assert.ok(isControllorDisabled)
}

async function disableConnector(cheif, connectorAddress) {
    var connectorInstance = await connectorsContract.deployed();
    await connectorInstance.disable(connectorAddress, {from:cheif});
    var isEnabled = await connectorInstance.connectors(connectorAddress)
    assert.ok(!isEnabled)
}

async function enableConnector(cheif, connectorAddress) {
    var connectorInstance = await connectorsContract.deployed();
    await connectorInstance.enable(connectorAddress, {from:cheif});
    var isEnabled = await connectorInstance.connectors(connectorAddress)
    assert.ok(isEnabled)
}


function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }