// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: [
    {
      name: "HardhatOverrides_0",
      include: ["Facet_0"],
      exclude: ["Exclude_0"],
      filter() {
        return false;
      },
      strict: false,
    },
    {
      name: "HardhatOverrides_1",
      include: ["Facet_1"],
      exclude: ["Exclude_1"],
      filter() {
        return false;
      },
      strict: false,
    },
  ],
};

export default config;
