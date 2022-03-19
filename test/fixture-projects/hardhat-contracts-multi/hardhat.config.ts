// We load the plugin here.
import type { HardhatUserConfig } from "hardhat/types";

import "../../../";

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  diamondAbi: [
    {
      name: "TestDiamond1",
      include: ["TestA"],
    },
    {
      name: "TestDiamond2",
      include: ["TestB"],
    },
    {
      name: "TestDiamond3",
      include: ["TestB"],
    }
  ],
};

export default config;
