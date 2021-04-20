
# DeFi Smart Accounts

This repository contains the core contracts for Instadapp DeFi Smart Accounts (DSAs).
  

## Installation

1. Install NPM Packages

```shell
npm i
```

2. Create a `.env` file in the root directory and use the below format for .`env` file.  
See `.env.example`. ( Alchemy signup is at <https://auth.alchemyapi.io/signup> )

```javascript
ALCHEMY_ID="<Replace with your Alchemy App/API key>" //For deploying
PRIVATE_KEY="<Private Key without 0x prefix"
```  

## Commands:

Compile contracts

```shell
npm run compile
```

Run the testcases

```shell
npm test
```

Get the test coverage

```shell
npm run coverage
```

Deploy

```shell
npx hardhat run scripts/deployAll.js --network hardhat
```

Or deploy to hardhat local node:

start in separate shell
```shell
npx hardhat node
```
then
```shell
npx hardhat run --network localhost scripts/deployAll.js
```

### Deployed Contracts

Deployed contract addresses can be found [here](docs/addresses.json)
