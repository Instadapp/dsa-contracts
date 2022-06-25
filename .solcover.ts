export default {
  skipFiles: [
    "v2/connectors/test",
    "v1/test",
    "v2/accounts/test",
    "v2/timelock",
    "v2/proxy/connectorsProxy",
    "v2/proxy/dummyConnectorsImpl",
  ],
  istanbulReporter: ["html", "json"],
};
