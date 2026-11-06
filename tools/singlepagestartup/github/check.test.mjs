/**
 * BDD Suite: GitHub pre-development reconciliation
 * Given a repository with a committed strategy and relevance rules
 * When the GitHub preflight examines commits after the first published strategy
 * Then it reports only unreconciled commits that can affect living artifacts
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkScript = path.join(currentDirectory, "check.ts");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

function git(repositoryRoot, ...args) {
  return run("git", args, repositoryRoot);
}

function write(repositoryRoot, relativePath, content) {
  const filePath = path.join(repositoryRoot, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function commit(repositoryRoot, message) {
  git(repositoryRoot, "add", ".");
  git(repositoryRoot, "commit", "-m", message);
  return git(repositoryRoot, "rev-parse", "HEAD");
}

function reconciliationConfig(layer) {
  return `schema: singlepagestartup.github-reconciliation.v1
remote: origin
branch: default
strategy_path: apps/studio/workspace/strategy/${layer}.md
ignore_paths: [apps/studio/workspace/utils/pre-development/github/**]
rules:
  - id: license
    paths: [LICENSE, NOTICE*]
    affected_artifacts: [${layer}.evidence, ${layer}.research, ${layer}.strategy]
    earliest_stage: 00-business
reconciliations: []
`;
}

function createRepository(
  contentState,
  repositoryIdentity = "singlepagestartup/singlepagestartup",
) {
  const repositoryRoot = mkdtempSync(
    path.join(os.tmpdir(), "sps-github-check-"),
  );
  git(repositoryRoot, "init", "-b", "main");
  git(repositoryRoot, "config", "user.email", "test@example.com");
  git(repositoryRoot, "config", "user.name", "Test User");
  git(
    repositoryRoot,
    "remote",
    "add",
    "origin",
    `https://github.com/${repositoryIdentity}.git`,
  );
  write(
    repositoryRoot,
    "apps/studio/workspace/utils/config.yaml",
    `schema: singlepagestartup.workspace-config.v1
default_layer: startup
repository_layers:
  singlepagestartup/singlepagestartup: singlepage
`,
  );
  for (const layer of ["singlepage", "startup"]) {
    write(
      repositoryRoot,
      `apps/studio/workspace/utils/pre-development/github/${layer}.yaml`,
      reconciliationConfig(layer),
    );
  }
  const layer =
    repositoryIdentity === "singlepagestartup/singlepagestartup"
      ? "singlepage"
      : "startup";
  write(
    repositoryRoot,
    `apps/studio/workspace/strategy/${layer}.md`,
    contentState === "empty"
      ? "# Strategy\n"
      : "# Strategy\n\n## Choice\n\nOne bounded experiment.\n",
  );
  const baseline = commit(repositoryRoot, `${contentState} strategy`);
  return { repositoryRoot, baseline, layer, repositoryIdentity };
}

function check(repositoryRoot, expectedLayer) {
  const layerArguments = expectedLayer ? ["--layer", expectedLayer] : [];
  return JSON.parse(
    run(
      "bun",
      [
        checkScript,
        "--repository",
        repositoryRoot,
        ...layerArguments,
        "--no-fetch",
        "--remote-ref",
        "HEAD",
      ],
      repositoryRoot,
    ),
  );
}

describe("GitHub pre-development reconciliation", () => {
  test("uses the first published content without approval metadata", () => {
    const { repositoryRoot } = createRepository("empty");
    const strategyPath = "apps/studio/workspace/strategy/singlepage.md";
    assert.equal(check(repositoryRoot).baseline_commit, null);
    write(
      repositoryRoot,
      strategyPath,
      "# Strategy\n\nA concrete market choice.\n",
    );
    const baseline = commit(repositoryRoot, "publish strategy");
    assert.equal(check(repositoryRoot).baseline_commit, baseline);
    write(
      repositoryRoot,
      strategyPath,
      "# Strategy\n\nA refined market choice.\n",
    );
    commit(repositoryRoot, "refine strategy");
    assert.equal(check(repositoryRoot).baseline_commit, baseline);
  });

  test("uses the downstream project's own first published strategy", () => {
    const { repositoryRoot } = createRepository(
      "empty",
      "example/client-product",
    );
    write(
      repositoryRoot,
      "apps/studio/workspace/strategy/singlepage.md",
      "# Strategy\n\nFramework direction.\n",
    );
    commit(repositoryRoot, "publish framework strategy");
    assert.equal(check(repositoryRoot).baseline_commit, null);
    write(
      repositoryRoot,
      "apps/studio/workspace/strategy/startup.md",
      "# Strategy\n\nClient market choice.\n",
    );
    const baseline = commit(repositoryRoot, "publish client strategy");
    assert.equal(check(repositoryRoot).baseline_commit, baseline);
  });

  /**
   * BDD Scenario: Resolve the writable layer from repository identity
   * Given the canonical framework repository and an unknown downstream repository
   * When the preflight starts without a caller-selected layer
   * Then it selects singlepage for the framework and startup for the downstream project
   */
  test("routes framework and downstream repositories to different layers", () => {
    const framework = createRepository("published");
    const frameworkResult = check(framework.repositoryRoot);
    assert.equal(frameworkResult.layer, "singlepage");
    assert.equal(frameworkResult.layer_source, "repository-map");
    assert.equal(
      frameworkResult.repository_identity,
      "singlepagestartup/singlepagestartup",
    );

    const downstream = createRepository("published", "example/client-product");
    const downstreamResult = check(downstream.repositoryRoot);
    assert.equal(downstreamResult.layer, "startup");
    assert.equal(downstreamResult.layer_source, "default");
    assert.equal(
      downstreamResult.repository_identity,
      "example/client-product",
    );

    assert.throws(
      () => check(framework.repositoryRoot, "startup"),
      /does not match resolved layer singlepage/,
    );

    write(
      framework.repositoryRoot,
      "apps/studio/workspace/utils/config.local.yaml",
      "active_layer: startup\n",
    );
    assert.throws(
      () => check(framework.repositoryRoot),
      /conflicts with repository singlepagestartup\/singlepagestartup resolved as singlepage/,
    );

    write(
      framework.repositoryRoot,
      "apps/studio/workspace/utils/config.local.yaml",
      "repository_layers:\n  singlepagestartup/singlepagestartup: startup\n",
    );
    assert.throws(
      () => check(framework.repositoryRoot),
      /may define only active_layer/,
    );
  });

  /**
   * BDD Scenario: Reject cross-layer reconciliation routes
   * Given a downstream repository whose startup ledger names a singlepage artifact
   * When the preflight validates the resolved layer configuration
   * Then it stops before a commit can be routed into the inherited framework sources
   */
  test("rejects affected artifacts outside the resolved layer", () => {
    const downstream = createRepository("published", "example/client-product");
    const configPath = path.join(
      downstream.repositoryRoot,
      "apps/studio/workspace/utils/pre-development/github/startup.yaml",
    );
    const invalidConfig = readFileSync(configPath, "utf8").replace(
      "startup.strategy]",
      "singlepage.strategy]",
    );
    writeFileSync(configPath, invalidConfig);

    assert.throws(
      () => check(downstream.repositoryRoot),
      /outside the startup layer/,
    );
  });

  /**
   * BDD Scenario: Reconcile the GitHub lifecycle deterministically
   * Given proposed, published, and later repository snapshots
   * When the preflight checks their remote commit ranges
   * Then it waits for a baseline, reports clean state, and routes each relevant commit once
   */
  test("handles baseline, relevant-change, and reconciliation states", () => {
    const proposed = createRepository("empty");
    const waiting = check(proposed.repositoryRoot);
    assert.equal(waiting.status, "waiting-for-baseline");
    assert.equal(waiting.baseline_commit, null);

    const published = createRepository("published");
    const clean = check(published.repositoryRoot);
    assert.equal(clean.status, "clean");
    assert.equal(clean.baseline_commit, published.baseline);
    assert.deepEqual(clean.pending, []);

    write(published.repositoryRoot, "LICENSE", "MIT License\n");
    const licenseCommit = commit(
      published.repositoryRoot,
      "publish MIT license",
    );
    const detected = check(published.repositoryRoot);
    assert.equal(detected.status, "changes-detected");
    assert.equal(detected.pending[0].commit, licenseCommit);
    assert.deepEqual(detected.pending[0].matched_rules, ["license"]);
    assert.equal(detected.pending[0].earliest_stage, "00-business");
    assert.ok(
      detected.pending[0].affected_artifacts.includes("singlepage.strategy"),
    );

    const configPath = path.join(
      published.repositoryRoot,
      "apps/studio/workspace/utils/pre-development/github/singlepage.yaml",
    );
    const config = readFileSync(configPath, "utf8").replace(
      "reconciliations: []",
      `reconciliations:
  - commit: ${licenseCommit}
    outcome: material
    summary: MIT License publication was reconciled.
    affected_artifacts: [singlepage.research, singlepage.strategy]`,
    );
    writeFileSync(configPath, config);

    const reconciled = check(published.repositoryRoot);
    assert.equal(reconciled.status, "clean");
    assert.deepEqual(reconciled.pending, []);

    commit(published.repositoryRoot, "record GitHub reconciliation");
    const afterLedgerCommit = check(published.repositoryRoot);
    assert.equal(afterLedgerCommit.status, "clean");
    assert.deepEqual(afterLedgerCommit.pending, []);
  });
});
