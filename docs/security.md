# Security Considerations
In this section, we will document and explain any security considerations that is important for users and developers building on top of DSAs to be familiar with.

## Malicious Actors Creating DSAs With Backdoors 
Using the buildWithCast function, it is possible for developers to build an elegant experience where the defi account could be managed, secured by a 3rd party upon creation.

However, this also makes it possible for malicious players to be pretending they are creating defi accounts with no backdoors, but for example, casting themselves as co-owners, and draining the funds after assets have been created.

**It is important to note the DSAs deployed through Instadapp are perfectly secure.**

This type of tradeoff is very common in the DeFi space, and this is a topic we discussed extensively with [Samczsun](https://samczsun.com/instadapp-audit-loa/) in the audit.  

We are performing the following mitigations:

### Mitigations

- Document and explain the risk to devs properly (hence this document)
- Users will be able to see all the contracts they own and corresponding authentications in Instadapp
- Helper smart contracts and SDKs to help developers reliably show all current DSAs and respective auths directly from onchain data (vs using events)
- Have a user friendly “DSA verification” page, kinda like how google has a page for you go through all your existing auths.

These will be done incrementally as part of our efforts to maintain a secure DSA ecosystem.