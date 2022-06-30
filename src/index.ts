import * as path from "path";
import { createHash } from "crypto";
import debug from "debug";
import { utils } from "ethers";
import { TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from "hardhat/builtin-tasks/task-names";
import { extendConfig, subtask } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";
import type {
  HardhatConfig,
  HardhatRuntimeEnvironment,
  HardhatUserConfig,
  RunSuperFunction,
  TaskArguments,
} from "hardhat/types";
// TODO: Avoid Hardhat internals
import { CompilationJob } from "hardhat/internal/solidity/compilation-job";
// TODO: Avoid Hardhat internals
import { ResolvedFile } from "hardhat/internal/solidity/resolver";

import * as pkg from "../package.json";

export const PLUGIN_NAME = pkg.name;
export const PLUGIN_VERSION = pkg.version;
// An empty contract file is provided in the plugin otherwise Hardhat will eject us from the cache
export const CONTRACT_PATH = path.join(__dirname, "contract.sol");
const CONTRACT_NAME = "HardhatDiamondABI.sol";

const { Fragment, FormatTypes } = utils;

const log = debug(PLUGIN_NAME);

// TODO: Export from Hardhat internals because this type isn't exposed by them currently
type ArtifactsEmittedPerFile = Array<{
  file: ResolvedFile;
  artifactsEmitted: string[];
}>;

// TODO: Export from Hardhat internals because this type isn't exposed by them currently
type ArtifactsEmittedPerJob = Array<{
  compilationJob: CompilationJob;
  artifactsEmittedPerFile: ArtifactsEmittedPerFile;
}>;

function createArtifact(artifactName: string, abi: unknown[]) {
  return {
    _format: "hh-sol-artifact-1",
    contractName: artifactName,
    sourceName: `${PLUGIN_NAME}/${CONTRACT_NAME}`,
    abi: abi,
    deployedBytecode: "",
    bytecode: "",
    linkReferences: {},
    deployedLinkReferences: {},
  } as const;
}

// This is our custom CompilationJob with information about the Diamond ABI
class DiamondAbiCompilationJob extends CompilationJob {
  private pluginName = PLUGIN_NAME;
  private pluginVersion = PLUGIN_VERSION;

  private _file: ResolvedFile;

  private artifacts: ReturnType<typeof createArtifact>[] = [];

  constructor() {
    // Dummy solidity version that can never be valid
    super({ version: "X.X.X", settings: {} });

    const sourceName = `${this.pluginName}/${CONTRACT_NAME}`;

    const absolutePath = CONTRACT_PATH;
    const content = { rawContent: "", imports: [], versionPragmas: [] };
    // Dummy a content hash with the plugin name & version
    const contentHash = createHash("md5").update(`${this.pluginName}_${this.pluginVersion}`).digest("hex");
    const lastModificationDate = new Date();

    this._file = new ResolvedFile(
      sourceName,
      absolutePath,
      content,
      contentHash,
      lastModificationDate,
      this.pluginName,
      this.pluginVersion
    );
  }

  emitsArtifacts() {
    return true;
  }

  hasSolc9573Bug() {
    return false;
  }

  getResolvedFiles() {
    return [this._file];
  }

  getFile() {
    return this._file;
  }

  addArtifact(artifact: ReturnType<typeof createArtifact>) {
    this.artifacts.push(artifact);
  }

  getArtifactsEmitted() {
    return this.artifacts.map((artifact) => artifact.contractName);
  }
}

interface DiamondAbiUserConfig {
  name: string;
  // We can't accept RegExp until https://github.com/nomiclabs/hardhat/issues/2181
  include?: string[];
  exclude?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: (abiElement: any, index: number, abi: any[], fullyQualifiedName: string) => boolean;
  strict?: boolean;
}

// Add our types to the Hardhat config
declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    diamondAbi?: DiamondAbiUserConfig | DiamondAbiUserConfig[];
  }

  interface HardhatConfig {
    diamondAbi: {
      name: string;
      // We can't accept RegExp until https://github.com/nomiclabs/hardhat/issues/2181
      include: string[];
      exclude: string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: (abiElement: any, index: number, abi: any[], fullyQualifiedName: string) => boolean;
      strict: boolean;
    }[];
  }
}

extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
  config.diamondAbi = [userConfig.diamondAbi].flat().map(function (userConfig) {
    const { name, include = [], exclude = [], filter, strict = true } = userConfig ?? {};

    if (!name) {
      throw new HardhatPluginError(PLUGIN_NAME, "`name` config is required.");
    }

    if (typeof name !== "string") {
      throw new HardhatPluginError(PLUGIN_NAME, "`name` config must be a string.");
    }

    if (include && !Array.isArray(include)) {
      throw new HardhatPluginError(PLUGIN_NAME, "`include` config must be an array if provided.");
    }

    if (exclude && !Array.isArray(exclude)) {
      throw new HardhatPluginError(PLUGIN_NAME, "`exclude` config must be an array if provided.");
    }

    if (filter && typeof filter !== "function") {
      throw new HardhatPluginError(PLUGIN_NAME, "`filter` config must be a function if provided.");
    }

    if (typeof strict !== "boolean") {
      throw new HardhatPluginError(PLUGIN_NAME, "`strict` config must be a boolean if provided.");
    }
    return {
      name,
      include,
      exclude,
      filter,
      strict,
    };
  });
});

// We ONLY hook this task, instead of providing a separate task to run, because
// Hardhat will clear out old artifacts on next run if we don't work around their
// caching mechanisms.
subtask(TASK_COMPILE_SOLIDITY_COMPILE_JOBS).setAction(generateDiamondAbi);

export async function generateDiamondAbi(
  args: TaskArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: RunSuperFunction<TaskArguments>
): Promise<{ artifactsEmittedPerJob: ArtifactsEmittedPerJob }> {
  const out: { artifactsEmittedPerJob: ArtifactsEmittedPerJob } = await runSuper(args);

  if (out.artifactsEmittedPerJob.length === 0) {
    return out;
  }

  const compilationJob = new DiamondAbiCompilationJob();

  const contracts = await hre.artifacts.getAllFullyQualifiedNames();

  for (const config of hre.config.diamondAbi) {
    const mergedAbis = [];

    for (const contractName of contracts) {
      // We can't accept a RegExp until https://github.com/nomiclabs/hardhat/issues/2181
      if (config.include && config.include.length && !config.include.some((m) => contractName.match(m))) {
        log(`Skipping ${contractName} because it didn't match any \`include\` patterns.`);
        continue;
      }
      // We can't accept a RegExp until https://github.com/nomiclabs/hardhat/issues/2181
      if (config.exclude && config.exclude.length && config.exclude.some((m) => contractName.match(m))) {
        log(`Skipping ${contractName} because it did matched an \`exclude\` pattern.`);
        continue;
      }

      // this should be the output filename, but this will work too
      if (contractName.startsWith(PLUGIN_NAME)) {
        log(`Skipping ${contractName} because it is the stub ABI produced by ${PLUGIN_NAME}.`);
        continue;
      }

      // debug(including contractName in Name ABI)
      log(`Including ${contractName} in your ${config.name} ABI.`);

      const { abi } = await hre.artifacts.readArtifact(contractName);

      mergedAbis.push(
        ...abi.filter((abiElement, index, abi) => {
          if (abiElement.type === "constructor") {
            return false;
          }
          if (abiElement.type === "fallback") {
            return false;
          }
          if (abiElement.type === "receive") {
            return false;
          }
          if (typeof config.filter === "function") {
            return config.filter(abiElement, index, abi, contractName);
          }

          return true;
        })
      );
    }

    if (config.strict) {
      // Validate the ABI if `strict` option is `true`
      // Consumers may opt to validate their Diamond doesn't contain duplicate
      // functions before a deployment. There isn't a great way to determine
      // this before a deployment, but `diamondCut` will fail if you try to cut
      // multiple functions (thus failing a deploy).
      const diamondAbiSet = new Set();

      mergedAbis.forEach((abi) => {
        const sighash = Fragment.fromObject(abi).format(FormatTypes.sighash);
        if (diamondAbiSet.has(sighash)) {
          throw new HardhatPluginError(
            PLUGIN_NAME,
            `Failed to create ${config.name} ABI - \`${sighash}\` appears twice.`
          );
        }
        diamondAbiSet.add(sighash);
      });
    }

    const artifact = createArtifact(config.name, mergedAbis);

    // Save into the Hardhat cache so artifact utilities can load it
    await hre.artifacts.saveArtifactAndDebugFile(artifact);

    compilationJob.addArtifact(artifact);
  }

  const file = compilationJob.getFile();
  const artifactsEmitted = compilationJob.getArtifactsEmitted();

  return {
    artifactsEmittedPerJob: [
      ...out.artifactsEmittedPerJob,
      // Add as another job to the list
      {
        compilationJob,
        artifactsEmittedPerFile: [
          {
            file,
            artifactsEmitted,
          },
        ],
      },
    ],
  };
}
