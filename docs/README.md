# DeFi Smart Accounts Overview
DeFi Smart Accounts (DSA) are contract accounts developed by [Instadapp](http://instadapp.io) and **trustlessly owned by the users**. In this guide, we will explain the three key entities in the system: DeFi smart accounts, connectors and authentication modules. 

Full API docs and comprehensive guides to come in time.

## Developers

- Front end developers, including wallets, can build DeFi and smart wallet capabilities on top of their existing products. As new modules are added to the ecosystem, they can extend their DeFi capabilities and business model without the need for any smart contract or security expertise. 
- DeFi developers can create complex cross protocol transactions like Instadapp’s protocol bridge with only web2 code. 
- Protocol developers can make their systems accessible all DSA users and devs by collaborating with us to build connectors.

For further context about motivation and likely use cases, read the accompanying [blog post](https://blog.instadapp.io/defi-smart-accounts/).

## Key Entities
There are 3 key entities in DSAs:

1. **Defi Accounts**, which are trustlessly owned by the users. Assets are stored here. DSAs can execute composed transactions across connectors.
2. **Connectors**, which are standardized modules that interact with the various protocols, and make the important actions accessible to smart accounts. 
3. **Authentication Modules**, which users can use to set guardians, managers or automation bots to manage their DSA. Permissions can be modular down to connector levels. For example, users can allow the wallet provider to rebalance his assets to minimize interest payment or maximize yields, but nothing else. 

<img width="763" alt="Screenshot 2020-03-15 at 6 41 46 PM" src="https://user-images.githubusercontent.com/173707/76699907-d7f9aa80-66ec-11ea-8bb1-d7d508ef44e0.png">

Let us review each of these in more detail:

## 1. DeFi Smart Accounts
DSAs are created by regular Ethereum accounts (or EOAs). Each Ethereum can create as many DeFi accounts as they want. DeFi accounts are fully trustless, so users can choose to withdraw their assets anytime to the owners.

DeFi accounts can compose and execute any number of actions from connectors in a single web3 transaction. Using only web3 calls, frontend developers will be able to string together the available actions in the connectors to create innovative new transactions.

For example, to build the protocol bridge function, the DSA will string together functions across the compound, maker and liquidity bridge connectors. We call these “spells”, and we will be elaborating on them in more detail.

To get started, the `build` function will be called, after which a DeFi smart account will be created belonging to the EOA. The developer can also help user build custom DSAs with one transaction, for example, create a DSA and deposit assets directly, or provide a 3rd party or bot with permissions to manage the assets for example.

## 2. Connectors
DSAs are powerful because they can easily be extended with connectors. Every new connector that is added is immediately usable by any developer building on top of DSAs. Connectors can either be base connectors to protocols, auth connectors, higher level connectors with more specific use cases like optimized lending, or connectors to native liquidity pools. 

Let's review what these are, and then we will give an example of how they can be used to allow developers to build complex cross protocol transactions. 

### Types Of Connectors
Different types of connectors provide different set of capabilities towards DSAs. Each connector has a set of functions that can be executed by the DSA owner or managers (depending on authentication settings).

1. Protocol connectors: Access key protocol functions directly. 
2. Auth connectors: Update permissions of the smart accounts.
3. Use case specific connectors: Execute higher level use cases that cannot be done or expensive with stringing basic functions. 
4. Instapool connectors<sup>*</sup>: Access the native short term liquidity pool for features that require asset porting, or "flash loans" for example, porting debt positions, interest payment minimization or yield maximization. 

<sup>*</sup> Liquidity pools is not launched at the moment. It will be free to use.

### Casting Spells

`Spells` denotes a sequence of connector functions that will achieve a given use case. Spells can comprise of any number of functions across any number of connectors. 

For example, to build the protocol bridge to migrate debt from Maker To  Compound, the DSA will `cast` the following `spell` across the Instapool, Maker and Compound connectors.

1. Instapool: Access liquidity
2. Maker: Payback DAI 
3. Maker: Withdraw ETH 
4. Compound: deposit ETH 
5. Compound: borrow DAI 
6. Instapool: Return liquidity

Developers can trigger these spells from web2 code (or just the chrome console). They can also be called by a different account who has the right permissions delegated to them by the main account. 

## 3. Authentication Modules

Users will be able to grant permissions to other accounts to serve specific functions on behalf of them. These functions includes, but is not limited to:

- Guardians for account recovery
- Co-owner for shared admin management
- Managers for fund management, e.g. yield optimization 
- Bots for automation, e.g. vault saving 

Because authentication modules can be granular to the level of connectors, access can be provided at multiple levels: 
- For the whole DeFi account 
- For specific sets of connectors 
- To achieve a very high level of authentication granularity - an developer can create a highly use case specific connector.

It is up to the developer to optimize for the right balance of trustlessness and power, and we believe that users will reward the developers who provide the most amount of value in a safe and secure manner.


### Security And Transparency
To ensure maximum transparency and security, all of the user’s DSAs (and approved authentications will be visible Instadapp. We will also be providing helper smart contracts and SDKs to allow developers to easily see and verify the DSAs and corresponding authentications. 

## WIP

### Guides
- Getting started guide
- Creating a connector
- Casting a spell

### Docs
- Security considerations
- API docs
- Connector docs
- Permission module docs

### Examples
- Spell examples
- Use case specific connector
