import * as path from "path";
import { assert } from "chai";
import { resetHardhatContext } from "hardhat/plugins-testing";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbiNames(abi: any[]): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return abi.map((abi) => abi.name);
}

describe("hardhat-diamond-abi", function () {
  describe("Test Defaults", function () {
    beforeEach("Loading hardhat environment", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-defaults"));

      this.hre = require("hardhat");
    });

    afterEach("Resetting hardhat", function () {
      resetHardhatContext();
    });

    it("adds `diamondAbi` to the config", function () {
      assert.isDefined(this.hre.config.diamondAbi);
    });

    it("requires a `name` to be set", function () {
      assert.isString(this.hre.config.diamondAbi.name);
      assert.equal(this.hre.config.diamondAbi.name, "HardhatDefaults");
    });

    it("defaults undefined config", function () {
      // include
      assert.isArray(this.hre.config.diamondAbi.include);
      assert.isEmpty(this.hre.config.diamondAbi.include);
      // exclude
      assert.isArray(this.hre.config.diamondAbi.exclude);
      assert.isEmpty(this.hre.config.diamondAbi.exclude);
      // filter stays undefined to avoid extra function calls
      assert.isUndefined(this.hre.config.diamondAbi.filter);
      // strict
      assert.isBoolean(this.hre.config.diamondAbi.strict);
      assert.isTrue(this.hre.config.diamondAbi.strict);
    });
  });

  describe("Test Overrides", function () {
    beforeEach("Loading hardhat environment", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-overrides"));

      this.hre = require("hardhat");
    });

    afterEach("Resetting hardhat", function () {
      resetHardhatContext();
    });

    it("adds `diamondAbi` to the config", function () {
      assert.isDefined(this.hre.config.diamondAbi);
    });

    it("requires a `name` to be set", function () {
      assert.isString(this.hre.config.diamondAbi.name);
      assert.equal(this.hre.config.diamondAbi.name, "HardhatOverrides");
    });

    it("defaults undefined config", function () {
      // include
      assert.isArray(this.hre.config.diamondAbi.include);
      assert.sameOrderedMembers(this.hre.config.diamondAbi.include, ["Facet"]);
      // exclude
      assert.isArray(this.hre.config.diamondAbi.exclude);
      assert.sameOrderedMembers(this.hre.config.diamondAbi.exclude, ["ABCDEF"]);
      // filter
      assert.isFunction(this.hre.config.diamondAbi.filter);
      // strict
      assert.isBoolean(this.hre.config.diamondAbi.strict);
      assert.isFalse(this.hre.config.diamondAbi.strict);
    });
  });

  describe("Invalid Throws", function () {
    afterEach("Resetting hardhat", function () {
      resetHardhatContext();
    });

    it("throws on no `name`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-no-name"));

      assert.throws(() => {
        require("hardhat");
      }, /`name` config is required/);
    });

    it("throws on empty `name`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-empty-name"));

      assert.throws(() => {
        require("hardhat");
      }, /`name` config is required/);
    });

    it("throws on non-string `name`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-wrong-type-name"));

      assert.throws(() => {
        require("hardhat");
      }, /`name` config must be a string/);
    });

    it("throws on non-array `include`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-wrong-type-include"));

      assert.throws(() => {
        require("hardhat");
      }, /`include` config must be an array if provided/);
    });

    it("throws on non-array `exclude`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-wrong-type-exclude"));

      assert.throws(() => {
        require("hardhat");
      }, /`exclude` config must be an array if provided/);
    });

    it("throws on non-function `filter`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-wrong-type-filter"));

      assert.throws(() => {
        require("hardhat");
      }, /`filter` config must be a function if provided/);
    });

    it("throws on non-boolean `strict`", function () {
      process.chdir(path.join(__dirname, "fixture-projects", "invalid-throws-wrong-type-strict"));

      assert.throws(() => {
        require("hardhat");
      }, /`strict` config must be a boolean if provided/);
    });
  });

  describe("Task", function () {
    afterEach("Resetting hardhat", async function () {
      const hre = require("hardhat");

      await hre.run(TASK_CLEAN);

      resetHardhatContext();
    });

    it("doesn't generate artifacts if there is nothing to compile", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-defaults"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isFalse(artifactExists);
    });

    it("generates an artifact if there is something to compile", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["foo", "bar"]);
    });

    it("always removes contructors when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-constructors"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["foo", "bar"]);
    });

    it("includes events and errors when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-events-errors"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["Foo", "ErrFoo", "foo", "Bar", "ErrBar", "bar"]);
    });

    it("includes only `include` contracts when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-include"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["foo"]);
    });

    it("excludes any `exclude` contracts when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-exclude"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["bar"]);
    });

    it("can filter any ABI with `filter` when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-filter"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["foo"]);
    });

    it("validates against duplicates by default when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-strict"));

      const hre = require("hardhat");

      try {
        await hre.run(TASK_COMPILE);
      } catch (err) {
        assert.equal(err.message, "Failed to create HardhatDiamond ABI - `baz()` appears twice.");
      }

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isFalse(artifactExists);
    });

    it("can disable validation against duplicates when generating an artifact", async function () {
      process.chdir(path.join(__dirname, "fixture-projects", "hardhat-contracts-no-strict"));

      const hre = require("hardhat");

      await hre.run(TASK_COMPILE);

      const artifactExists = await hre.artifacts.artifactExists(hre.config.diamondAbi.name);
      assert.isTrue(artifactExists);
      const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
      assert.sameMembers(getAbiNames(abi), ["foo", "baz", "bar", "baz"]);
    });
  });
});
