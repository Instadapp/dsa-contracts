module.exports = {
  skipFiles: [
    "v2/accounts/test",
    "v2/connectors/test",
    "v2/timelock",
    "v2/proxy/connectorsProxy.sol",
    "v2/proxy/dummyConnectorsImpl.sol",
    "v1/test",
  ],
  istanbulReporter: ["html", "json"],
};
