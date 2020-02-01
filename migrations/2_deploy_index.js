const indexContract = artifacts.require("InstaIndex");
const path = require('path');
const replace = require('replace-in-file');
const fs = require('fs');



module.exports = async function(deployer) {
    await deployer.deploy(indexContract);
    var indexContract = await indexContract.deployed();
    console.log("Registry Address:", indexContract.address)
    var filePaths = ['account.sol', 'registry/list.sol', 'registry/Connectors.sol']
    
    for (let i = 0; i < 3; i++) {
        const element = filePaths[i];
        const filePath = path.resolve(__dirname, '../contracts', element);
        
        fs.readFile(filePath, "utf8", async  (err, data) => {
            const options = {
                files: [filePath],
                from: /constant index = (.*);/,
                to: `constant index = ${indexContract.address};`,
                countMatches: true
              };
            
            await replace(options).then(results => {
                console.log(`\n${element} has changed`, results[0].hasChanged);
            }).catch(error => {
                console.error(`${element}`, error);
            });

        });

    }
    
    await pause(10)
    return;
};


function pause(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
  }