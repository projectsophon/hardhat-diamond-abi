// We load the plugin here.

require("../../../");

const config = {
  solidity: "0.8.10",
  diamondAbi: [{
    name: "FooBar",
    include: "Wrong",
  }],
};

module.exports = config;
