import {
  documentConfirmation,
  parseDocument,
} from "../../studio/workspace/document";
import { mergeMarkdown } from "../../studio/workspace/merge";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import {
  resolveWorkspaceLayer,
  type WorkspaceLayer,
} from "../../studio/workspace/repository-layer";

export type TPreDevelopmentStage =
  | "00-business"
  | "10-strategy"
  | "20-brand"
  | "30-design"
  | "40-products";

export interface IGitHubReconciliationRule {
  id: string;
  paths: string[];
  affected_artifacts: string[];
  earliest_stage: TPreDevelopmentStage;
}

export interface IGitHubReconciliationRecord {
  commit: string;
  outcome: "material" | "no-material-effect";
  summary: string;
  affected_artifacts?: string[];
}

export interface IGitHubReconciliationConfig {
  schema: "singlepagestartup.github-reconciliation.v1";
  remote: string;
  branch: string;
  strategy_path: string;
  ignore_paths: string[];
  rules: IGitHubReconciliationRule[];
  reconciliations: IGitHubReconciliationRecord[];
}

export interface IChangedFile {
  status: string;
  path: string;
  previous_path?: string;
}

export interface IPendingGitHubCommit {
  commit: string;
  subject: string;
  committed_at: string;
  files: IChangedFile[];
  matched_rules: string[];
  affected_artifacts: string[];
  earliest_stage: TPreDevelopmentStage;
}

export interface IGitHubCheckResult {
  status: "waiting-for-baseline" | "clean" | "changes-detected";
  layer: WorkspaceLayer;
  layer_source: "active-layer" | "repository-map" | "default";
  repository_identity: string | null;
  remote: string;
  remote_ref: string;
  baseline_commit: string | null;
  head_commit: string;
  ignored_commit_count: number;
  pending: IPendingGitHubCommit[];
}

export interface ICheckGitHubChangesOptions {
  repositoryRoot: string;
  expectedLayer?: WorkspaceLayer;
  repositoryIdentity?: string;
  fetchRemote?: boolean;
  remoteRef?: string;
}

const stageOrder: TPreDevelopmentStage[] = [
  "00-business",
  "10-strategy",
  "20-brand",
  "30-design",
  "40-products",
];

function runGit(repositoryRoot: string, args: string[], allowFailure = false) {
  const result = Bun.spawnSync({
    cmd: ["git", ...args],
    cwd: repositoryRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = new TextDecoder().decode(result.stdout).trim();
  const stderr = new TextDecoder().decode(result.stderr).trim();
  if (result.exitCode !== 0 && !allowFailure) {
    const detail = stderr || stdout || "unknown error";
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return result.exitCode === 0 ? stdout : "";
}

function globToRegExp(pattern: string) {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      if (pattern[index + 2] === "/") {
        source += "(?:.*/)?";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character.replace(/[\\^$+?.()|{}[\]]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`);
}

function matchesRule(file: IChangedFile, rule: IGitHubReconciliationRule) {
  return rule.paths.some((pattern) => {
    const expression = globToRegExp(pattern);
    return (
      expression.test(file.path) ||
      Boolean(file.previous_path && expression.test(file.previous_path))
    );
  });
}

function matchesAnyPath(file: IChangedFile, patterns: string[]) {
  return patterns.some((pattern) => {
    const expression = globToRegExp(pattern);
    return (
      expression.test(file.path) ||
      Boolean(file.previous_path && expression.test(file.previous_path))
    );
  });
}

function validateConfig(
  config: IGitHubReconciliationConfig,
  configPath: string,
  layer: WorkspaceLayer,
) {
  if (config.schema !== "singlepagestartup.github-reconciliation.v1") {
    throw new Error(`${configPath} has an unsupported schema`);
  }
  if (!config.remote || !config.branch || !config.strategy_path) {
    throw new Error(
      `${configPath} must define remote, branch, and strategy_path`,
    );
  }
  if (!Array.isArray(config.ignore_paths)) {
    throw new Error(`${configPath} ignore_paths must be an array`);
  }
  if (!Array.isArray(config.rules) || config.rules.length === 0) {
    throw new Error(`${configPath} must define at least one relevance rule`);
  }
  if (!Array.isArray(config.reconciliations)) {
    throw new Error(`${configPath} reconciliations must be an array`);
  }

  const expectedStrategyPath = `apps/studio/workspace/strategy/${layer}.md`;
  if (config.strategy_path !== expectedStrategyPath) {
    throw new Error(
      `${configPath} strategy_path must be ${expectedStrategyPath}`,
    );
  }

  const ruleIds = new Set<string>();
  for (const rule of config.rules) {
    if (ruleIds.has(rule.id)) {
      throw new Error(`${configPath} repeats rule ${rule.id}`);
    }
    ruleIds.add(rule.id);
    if (!stageOrder.includes(rule.earliest_stage)) {
      throw new Error(
        `${configPath} rule ${rule.id} has an invalid earliest_stage`,
      );
    }
    if (!rule.paths.length || !rule.affected_artifacts.length) {
      throw new Error(
        `${configPath} rule ${rule.id} must define paths and affected_artifacts`,
      );
    }
    for (const artifactId of rule.affected_artifacts) {
      if (!artifactId.startsWith(`${layer}.`)) {
        throw new Error(
          `${configPath} rule ${rule.id} routes ${artifactId} outside the ${layer} layer`,
        );
      }
    }
  }

  const commits = new Set<string>();
  for (const record of config.reconciliations) {
    if (!/^[0-9a-f]{40}$/.test(record.commit)) {
      throw new Error(
        `${configPath} has an invalid reconciled commit ${record.commit}`,
      );
    }
    if (commits.has(record.commit)) {
      throw new Error(
        `${configPath} repeats reconciled commit ${record.commit}`,
      );
    }
    commits.add(record.commit);
    for (const artifactId of record.affected_artifacts ?? []) {
      if (!artifactId.startsWith(`${layer}.`)) {
        throw new Error(
          `${configPath} reconciliation ${record.commit} routes ${artifactId} outside the ${layer} layer`,
        );
      }
    }
  }
}

function loadConfig(repositoryRoot: string, layer: WorkspaceLayer) {
  const configPath = path.join(
    repositoryRoot,
    "apps/studio/workspace/utils/pre-development/github",
    `${layer}.yaml`,
  );
  if (!existsSync(configPath)) {
    throw new Error(`missing GitHub reconciliation config ${configPath}`);
  }
  const config = parse(
    readFileSync(configPath, "utf8"),
  ) as IGitHubReconciliationConfig;
  validateConfig(config, configPath, layer);
  return config;
}

function resolveRemoteRef(
  repositoryRoot: string,
  config: IGitHubReconciliationConfig,
  override?: string,
) {
  if (override) return override;
  if (config.branch !== "default") {
    return `refs/remotes/${config.remote}/${config.branch}`;
  }
  const advertisedHead = runGit(
    repositoryRoot,
    ["ls-remote", "--symref", config.remote, "HEAD"],
    true,
  );
  const advertisedBranch = advertisedHead.match(
    /^ref:\s+refs\/heads\/(.+?)\s+HEAD$/m,
  )?.[1];
  if (advertisedBranch) {
    return `refs/remotes/${config.remote}/${advertisedBranch}`;
  }
  throw new Error(
    `cannot resolve ${config.remote}'s live default branch; configure an explicit branch`,
  );
}

export function findApprovedStrategyBaseline(
  repositoryRoot: string,
  remoteRef: string,
  strategyPath: string,
) {
  const commits = runGit(repositoryRoot, [
    "log",
    "--reverse",
    "--format=%H",
    remoteRef,
    "--",
    strategyPath,
  ])
    .split("\n")
    .filter(Boolean);

  for (const commit of commits) {
    const source = runGit(
      repositoryRoot,
      ["cat-file", "-p", `${commit}:${strategyPath}`],
      true,
    );
    const layer = strategyPath.endsWith("/startup.md")
      ? "startup"
      : "singlepage";
    if (parseDocument(source).metadata.confirmation !== undefined) {
      const base =
        layer === "startup"
          ? runGit(
              repositoryRoot,
              [
                "cat-file",
                "-p",
                `${commit}:${strategyPath.replace(/startup\.md$/, "singlepage.md")}`,
              ],
              true,
            )
          : "";
      const resolved =
        layer === "startup" ? mergeMarkdown(base, source).content : source;
      if (documentConfirmation(resolved, layer).confirmed) return commit;
    } else if (/^\|\s*Status\s*\|\s*`?approved`?\s*\|\s*$/m.test(source)) {
      // Published strategies predating document metadata retain their baseline.
      return commit;
    }
  }
  return null;
}

function changedFiles(repositoryRoot: string, commit: string): IChangedFile[] {
  const revision = runGit(repositoryRoot, [
    "rev-list",
    "--parents",
    "-n",
    "1",
    commit,
  ]);
  const [, firstParent] = revision.split(/\s+/);
  const output = firstParent
    ? runGit(repositoryRoot, [
        "diff",
        "--name-status",
        "-M",
        firstParent,
        commit,
      ])
    : runGit(repositoryRoot, [
        "diff-tree",
        "--root",
        "--no-commit-id",
        "--name-status",
        "-r",
        "-M",
        commit,
      ]);

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, firstPath, secondPath] = line.split("\t");
      if (status.startsWith("R") || status.startsWith("C")) {
        return { status, previous_path: firstPath, path: secondPath };
      }
      return { status, path: firstPath };
    });
}

function earliestStage(rules: IGitHubReconciliationRule[]) {
  return rules.reduce<TPreDevelopmentStage>((earliest, rule) => {
    return stageOrder.indexOf(rule.earliest_stage) <
      stageOrder.indexOf(earliest)
      ? rule.earliest_stage
      : earliest;
  }, "40-products");
}

export function checkGitHubChanges(
  options: ICheckGitHubChangesOptions,
): IGitHubCheckResult {
  const layerResolution = resolveWorkspaceLayer({
    repositoryRoot: options.repositoryRoot,
    repositoryIdentity: options.repositoryIdentity,
  });
  if (
    options.expectedLayer &&
    options.expectedLayer !== layerResolution.layer
  ) {
    throw new Error(
      `requested layer ${options.expectedLayer} does not match resolved layer ${layerResolution.layer}`,
    );
  }
  const layer = layerResolution.layer;
  const config = loadConfig(options.repositoryRoot, layer);
  if (options.fetchRemote !== false) {
    const remoteUrl = runGit(options.repositoryRoot, [
      "remote",
      "get-url",
      config.remote,
    ]);
    if (!/(?:github\.com|githubusercontent\.com)[/:]/.test(remoteUrl)) {
      throw new Error(`${config.remote} is not a GitHub remote: ${remoteUrl}`);
    }
    runGit(options.repositoryRoot, ["fetch", "--quiet", config.remote]);
  }

  const remoteRef = resolveRemoteRef(
    options.repositoryRoot,
    config,
    options.remoteRef,
  );
  const headCommit = runGit(options.repositoryRoot, ["rev-parse", remoteRef]);
  const baselineCommit = findApprovedStrategyBaseline(
    options.repositoryRoot,
    remoteRef,
    config.strategy_path,
  );

  if (!baselineCommit) {
    return {
      status: "waiting-for-baseline",
      layer,
      layer_source: layerResolution.source,
      repository_identity: layerResolution.repositoryIdentity ?? null,
      remote: config.remote,
      remote_ref: remoteRef,
      baseline_commit: null,
      head_commit: headCommit,
      ignored_commit_count: 0,
      pending: [],
    };
  }

  const reconciled = new Set(
    config.reconciliations.map((record) => record.commit),
  );
  const commits = runGit(options.repositoryRoot, [
    "rev-list",
    "--reverse",
    `${baselineCommit}..${headCommit}`,
  ])
    .split("\n")
    .filter(Boolean);
  const pending: IPendingGitHubCommit[] = [];
  let ignoredCommitCount = 0;

  for (const commit of commits) {
    if (reconciled.has(commit)) continue;
    const files = changedFiles(options.repositoryRoot, commit);
    const reviewFiles = files.filter(
      (file) => !matchesAnyPath(file, config.ignore_paths),
    );
    const matchedRules = config.rules.filter((rule) =>
      reviewFiles.some((file) => matchesRule(file, rule)),
    );
    if (matchedRules.length === 0) {
      ignoredCommitCount += 1;
      continue;
    }
    pending.push({
      commit,
      subject: runGit(options.repositoryRoot, [
        "show",
        "-s",
        "--format=%s",
        commit,
      ]),
      committed_at: runGit(options.repositoryRoot, [
        "show",
        "-s",
        "--format=%cI",
        commit,
      ]),
      files,
      matched_rules: [...new Set(matchedRules.map((rule) => rule.id))],
      affected_artifacts: [
        ...new Set(matchedRules.flatMap((rule) => rule.affected_artifacts)),
      ],
      earliest_stage: earliestStage(matchedRules),
    });
  }

  return {
    status: pending.length > 0 ? "changes-detected" : "clean",
    layer,
    layer_source: layerResolution.source,
    repository_identity: layerResolution.repositoryIdentity ?? null,
    remote: config.remote,
    remote_ref: remoteRef,
    baseline_commit: baselineCommit,
    head_commit: headCommit,
    ignored_commit_count: ignoredCommitCount,
    pending,
  };
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (import.meta.main) {
  try {
    const repositoryRoot = path.resolve(
      argument("--repository") ?? path.join(import.meta.dirname, "../../.."),
    );
    const expectedLayer = argument("--layer");
    if (
      expectedLayer != null &&
      expectedLayer !== "singlepage" &&
      expectedLayer !== "startup"
    ) {
      throw new Error("--layer must be singlepage or startup when provided");
    }
    const result = checkGitHubChanges({
      repositoryRoot,
      expectedLayer,
      fetchRemote: !process.argv.includes("--no-fetch"),
      remoteRef: argument("--remote-ref"),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `${JSON.stringify({ status: "unavailable", error: message }, null, 2)}\n`,
    );
    process.exitCode = 2;
  }
}
