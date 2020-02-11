const basicConnector = artifacts.require("ConnectBasic");
const connectorsContract = artifacts.require("InstaConnectors");
const indexContract = artifacts.require("InstaIndex");
const accountContract = artifacts.require("InstaAccount");
const listContract = artifacts.require("InstaList");

contract("InstaConnectors", async (accounts) => {
    const master = accounts[0];
    const cheifOne = accounts[8];

    let accountVersion;
     before(async() => {
        accountVersion = await getAccountVersion();
    })

    it("Connector Contract is deployed And registred in registry.", async () =>
    {   
        // Checking if connectors.sol contract deployed. And
        // connectors.sol address is set in index.sol
        var indexInstance = await indexContract.deployed(); //InstaIndex instance
        var ConnectorsIndexAddr = await indexInstance.connectors(accountVersion); //get connectors.sol address variable from index.sol
        var ConnectorsAddr = await connectorsContract.deployed() // get address of deployed connectors.sol
        assert.equal(ConnectorsIndexAddr, ConnectorsAddr.address)
    })

    it("Connectors Contract's index variable is index contract address.", async () =>
    {       
        // Get index address variable from connectors.sol
        await getConnectorsIndexAddress(accountVersion)
    })

    it("Removed Basic connector.(From: master).", async () =>
    {
        // disable a connector.
        await disableConnector(master, basicConnector.address)
    })

    it("Added Basic connector.(From: master).", async () =>
    {   
        // enable a connector.
        await enableConnector(master, basicConnector.address)
    })

    it("Removed Basic connector.(From: master).", async () =>
    {
         // disable a connector.
        await disableConnector(master, basicConnector.address)
    })

    it("Added new cheif.", async () =>
    {   
        // add new cheif
        await addControllor(master, cheifOne)
    })

    it("Added Basic connector.(From: cheif).", async () =>
    {   
         // enable a connector.
        await enableConnector(cheifOne, basicConnector.address)
    })

    it("No of connectors enabled are greater than 0.", async () =>
    {   
         // count of connectors enabled.
        await count()
    })

    // it("Removed Basic connector.(From: cheif).", async () =>
    // {    
    //     // disable a connector.
    //     await disableConnector(cheifOne, basicConnector.address)
    // })

    it("Removed cheif.", async () =>
    {   
         // remove new cheif
        await removeControllor(master, cheifOne)
    })
  });

  async function count() {
    var connectorInstance = await connectorsContract.deployed(); //InstaAccount instance
    let count = await connectorInstance.count();
    assert.notEqual(count, 0, "count is equal to zero")
  }

async function getConnectorsIndexAddress() {
    var indexInstance = await indexContract.deployed(); //InstaIndex instance
    var connectorInstance = await connectorsContract.deployed(); //InstaAccount instance
    var indexAddress = await connectorInstance.index(); // get index address variable from index.sol
    assert.equal(indexAddress, indexInstance.address)
}

async function addControllor(cheif, cheifAddress) {
    var connectorInstance = await connectorsContract.deployed(); //InstaConnectors instance
    var isControllorDisabled = !(await connectorInstance.chief(cheifAddress)) // check if the given address is enabled to add/remove connectors.
    assert.ok(isControllorDisabled)
    await connectorInstance.enableChief(cheifAddress, {from:cheif}); //Enable the given address in connectors.sol.
    var isControllorEnabled = await connectorInstance.chief(cheifAddress) // check if the given address is enabled to add/remove connectors.
    assert.ok(isControllorEnabled)
}

async function removeControllor(cheif, cheifAddress) {
    var connectorInstance = await connectorsContract.deployed(); //InstaConnectors instance
    var isControllorEnabled = await connectorInstance.chief(cheifAddress) // check if the given address is enabled to add/remove connectors.
    assert.ok(isControllorEnabled)
    await connectorInstance.disableChief(cheifAddress, {from:cheif}); //Disable the given address in connectors.sol.
    var isControllorDisabled = !(await connectorInstance.chief(cheifAddress)) // check if the given address is enabled to add/remove connectors.
    assert.ok(isControllorDisabled)
}

async function disableConnector(cheif, connectorAddress) {
    var connectorInstance = await connectorsContract.deployed(); //InstaConnectors instance
    await connectorInstance.disable(connectorAddress, {from:cheif}); // Disable the the given connector address
    var isEnabled = await connectorInstance.connectors(connectorAddress) // check if the give connector address is enabled.
    assert.ok(!isEnabled)
}

async function enableConnector(cheif, connectorAddress) {
    var connectorInstance = await connectorsContract.deployed(); //InstaConnectors instance
    await connectorInstance.enable(connectorAddress, {from:cheif}); // Enable the the given connector address
    var isEnabled = await connectorInstance.connectors(connectorAddress) // check if the give connector address is enabled.
    assert.ok(isEnabled)
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