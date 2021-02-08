const { web3 } = hre;
const { expect } = require("chai");


module.exports = function (receipt, abi, eventName, eventArgs) {
    const requiredEventABI = abi.filter(a => a.type === "event").find(a => a.name === eventName)
    if (!requiredEventABI) throw new Error(`${eventName} not found`)
    const eventHash = web3.utils.keccak256(`${requiredEventABI.name}(${requiredEventABI.inputs.map(a => a.type).toString()})`)
    const requiredEvent = receipt.events.find(a => a.topics[0] === eventHash)
    expect(!!requiredEvent).to.be.true
    const decodedEvent = web3.eth.abi.decodeLog(requiredEventABI.inputs, requiredEvent.data, requiredEvent.topics);
    if (eventArgs) {
        Object.keys(eventArgs).forEach((name) => {
            if (!decodedEvent[name]) throw new Error(`${name} arg not found`)
            expect(eventArgs[name]).to.be.equal(decodedEvent[name])
        })
    }
    return requiredEvent;
};
