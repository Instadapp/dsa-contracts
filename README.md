
# Smart Account

This repository contains the improved version of InstaDApp smart contract wallet.
  

## Installation

1. Install Truffle and Ganache CLI globally.

```javascript
npm  install -g  truffle@beta
npm  install -g  ganache-cli
```

2. Create a `.env` file in the root directory and use the below format for .`env` file.

```javascript
infura_key = [Infura key] //For deploying
mnemonic_key = [Mnemonic Key] // Also called as seed key
etherscan_key = [Etherscan API dev Key]
```  

## Commands:

```
Compile contracts: truffle compile
Migrate contracts: truffle migrate
Test contracts: truffle test --migrations_directory migrations_null
Run eslint: npm run lint
Run solium: npm run solium
Run solidity-coverage: npm run coverage
Run lint, solium, and truffle test: npm run test
```

**Note**: Before running any `truffle` command, Run the below command in another terminal.
```
truffle watch
```
