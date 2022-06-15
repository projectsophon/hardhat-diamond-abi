// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";
import { name } from "../../../package.json";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: {
    name: "HardhatDiamond",
    filter(abiElement, idx, abi, fullyQualifiedName) {
      if (fullyQualifiedName.startsWith(name)) {
        throw new Error("Saw our ABI in the output");
      }
      return true;
    },
  },
};

export default config;
