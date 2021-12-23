// We load the plugin here.

require("../../../");

const config = {
  solidity: "0.8.10",
  diamondAbi: {
    include: ["Facet"],
  },
};

module.exports = config;
