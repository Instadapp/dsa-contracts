const indexContract = artifacts.require("InstaIndex");
const path = require('path');
const replace = require('replace-in-file');



module.exports = async function(deployer) {
    await deployer.deploy(indexContract); // InstaIndex contract(index.sol) will be deployed.
    var indexInstance = await indexContract.deployed();
    console.log("Registry Address:", indexInstance.address)
    //Use to change index address const variable in 'account.sol', 'registry/list.sol', 'registry/Connectors.sol'
    var filePaths = ['account.sol', 'registry/list.sol', 'registry/Connectors.sol']
    for (let i = 0; i < 3; i++) {
        const file = filePaths[i];
        const filePath = path.resolve(__dirname, '../contracts', file);
        
        // fs.readFile(filePath, "utf8", async  (err, data) => {
        const options = {
            files: [filePath],
            from: /constant instaIndex = (.*);/,
            to: `constant instaIndex = ${indexInstance.address};`,
            countMatches: true
            };
        //replace the index address variable in the contract.
        await replace(options).then(results => {
            console.log(`\n${file} has changed`, results[0].hasChanged);
        }).catch(error => {
            console.error(`${file}`, error);
        });

        // });

    }
    // wait untill `truffle watch` compile the contracts again.
    await pause(10)
    return;
};


function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }