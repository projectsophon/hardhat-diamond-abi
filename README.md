# hardhat-diamond-abi

Hardhat plugin to combine multiple ABIs into a Diamond ABI artifact

## What

The Diamond Pattern, or [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535), is an upgrade and proxy pattern that registers functions from many different Smart Contracts, called Facets, into a single Diamond.

Once registered, all functions can be accessed through the Diamond; however, you still need the ABI for the original Facet to make interacting easy. This plugin can be used to combine all the ABIs from your Facets into a single ABI to work with any functions in your Diamond.

This is also very useful if you are using TypeChain and `@nomiclabs/hardhat-ethers` because we ensure that TypeChain will generate types for your Diamond ABI, which can then be loaded using:

```js
const diamond = await hre.ethers.getContractAt("MyDiamond", CONTRACT_ADDRESS);
```

## Installation

```bash
npm install hardhat-diamond-abi
```

Import the plugin in your `hardhat.config.js`:

```js
require("hardhat-diamond-abi");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "hardhat-diamond-abi";
```

## Tasks

This plugin hooks Hardhat's internal `TASK_COMPILE_SOLIDITY_COMPILE_JOBS` task, and doesn't provide any additional tasks.

The reason for this is two-fold:

1. TypeChain hooks this same task, and we want to be able run before it. There aren't better places to hook into the compile pipeline, since most others are subject to the Hardhat cache mechanism.
2. The Hardhat cache mechanism is **very** aggressive and will evict our Diamond ABI artifact unless we include our file before it generates the cache file. If we aren't included in the cache file, the Diamond ABI artifact will be removed from the `artifacts` directory the next time Hardhat is run.

## TypeChain

As mentioned above, this plugin uses the same hook as TypeChain. If you **load this plugin before TypeChain**, it will see the artifact we generate and create TypeScript types for your Diamond ABI!

It is very important that you import this plugin before TypeChain, otherwise it won't see our artifact when it generates types.

## Basic configuration

Set up your project (we'll use `best_dapp_ever/`) with the following minimal `hardhat.config.js` at the root. The only required property is `name`, which is used to name your Diamond ABI.

```js
module.exports = {
  solidity: "0.8.10",
  diamondAbi: {
    // (required) The name of your Diamond ABI
    name: "BestDappEver",
  },
};
```

Your project structure should look like this:

```
j:~/best_dapp_ever/ $ tree
├── hardhat.config.js
└── contracts
    ├── FacetA.sol
    └── FacetB.sol
```

Now, when you use `npx hardhat compile` to compile your contracts, a new ABI will exist in your artifacts.

```
j:~/best_dapp_ever/ $ tree
├── hardhat.config.js
├── artifacts
│   ├── contracts
│   │   ├── FacetA.sol
│   │   │   ├── FacetA.dbg.json
│   │   │   └── FacetA.json
│   │   └── FacetB.sol
│   │       ├── FacetB.dbg.json
│   │       └── FacetB.json
│   └── hardhat-diamond-abi
│       └── BestDappEver.sol
│           └── BestDappEver.json
└── contracts
    ├── FacetA.sol
    └── FacetB.sol
```

## Advanced configuration

If you'd like to adjust details about the included ABIs or individual functions, you can adjust any of these settings:

```js
module.exports = {
  solidity: "0.8.10",
  diamondAbi: {
    // (required) The name of your Diamond ABI.
    name: "BestDappEver",
    // (optional) An array of strings, matched against fully qualified contract names, to
    // determine which contracts are included in your Diamond ABI.
    include: ["Facet"],
    // (optional) An array of strings, matched against fully qualified contract names, to
    // determine which contracts are excluded from your Diamond ABI.
    exclude: ["vendor"],
    // (optional) A function that is called with the ABI element, index, entire ABI,
    // and fully qualified contract name for each item in the combined ABIs.
    // If the function returns `false`, the function is not included in your Diamond ABI.
    filter: function (abiElement, index, fullAbi, fullyQualifiedName) {
      return abiElement.name !== "superSecret";
    },
    // (optional) Whether exact duplicate sighashes should cause an error to be thrown,
    // defaults to true.
    strict: true,
  },
};
```
