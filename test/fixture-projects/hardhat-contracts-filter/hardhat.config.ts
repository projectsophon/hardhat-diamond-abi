// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: {
    name: "HardhatDiamond",
    filter(contractName, abi) {
      return abi.name === "foo";
    },
  },
};

export default config;
