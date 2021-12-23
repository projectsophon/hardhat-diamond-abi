// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: {
    name: "HardhatOverrides",
    include: ["Facet"],
    exclude: ["ABCDEF"],
    filter() {
      return false;
    },
    dedupe: false,
  },
};

export default config;
