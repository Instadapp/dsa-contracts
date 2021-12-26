import hre from "hardhat";
const { web3 } = hre;
import { expect } from "chai";

export default function (
  receipt: any,
  abi: any[],
  eventName?: any,
  eventArgs?: any,
  castEvents?: string | any[]
) {
  const requiredEventABI = abi
    .filter((a) => a.type === "event")
    .find((a) => a.name === eventName);
  if (!requiredEventABI) throw new Error(`${eventName} not found`);
  const eventHash = web3.utils.keccak256(
    `${requiredEventABI.name}(${requiredEventABI.inputs
      .map((a: { type: any }) => a.type)
      .toString()})`
  );
  const requiredEvent = receipt.events.find(
    (a: { topics: any[] }) => a.topics[0] === eventHash
  );
  expect(!!requiredEvent).to.be.true;
  const decodedEvent = web3.eth.abi.decodeLog(
    requiredEventABI.inputs,
    requiredEvent.data,
    requiredEvent.topics.slice(1)
  );

  if (eventArgs) {
    Object.keys(eventArgs).forEach((name) => {
      if (!decodedEvent[name]) throw new Error(`${name} arg not found`);
      expect(eventArgs[name]).to.be.equal(decodedEvent[name]);
    });
  }
  if (castEvents && castEvents.length > 0) {
    for (const castEvent of castEvents) {
      const abi = castEvent.abi;
      const eventName = castEvent.eventName;
      const eventParams = castEvent.eventParams;

      const eventArgs = requiredEvent.args;
      expect(!!eventArgs).to.be.true;

      const ABI = abi
        .filter((a: { type: string }) => a.type === "event")
        .find((a: { name: any }) => a.name === eventName);

      if (eventName) {
        const eventSignature = `${ABI.name}(${ABI.inputs
          .map((a: { type: any }) => a.type)
          .toString()})`;
        expect(eventArgs.eventNames).to.include(eventSignature);
      }

      if (eventParams) {
        const eventParamHash = web3.eth.abi.encodeParameters(
          ABI.inputs,
          eventParams
        );
        expect(eventArgs.eventParams).to.include(eventParamHash);
      }
    }
  }
  return requiredEvent;
}
