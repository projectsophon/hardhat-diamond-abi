// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: {
    name: "HardhatDiamond",
    filter(abiElement) {
      return abiElement.name === "foo";
    },
  },
};

export default config;
