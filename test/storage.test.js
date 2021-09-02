const { storageLayoutTest } = require("../scripts/validateStorageLayout");
describe("Storage upgrade Test", function () {
    it("Should test storage upgrade safe", async function() {
        await storageLayoutTest();
    }).timeout(10000000);
})