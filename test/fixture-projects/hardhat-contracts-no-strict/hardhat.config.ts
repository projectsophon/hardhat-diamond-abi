// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: {
    name: "HardhatDiamond",
    strict: false,
  },
};

export default config;
