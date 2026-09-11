import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type WorkspaceLayer = "singlepage" | "startup";
export type WorkspaceLayerSelection = WorkspaceLayer | "auto";

export interface IWorkspaceConfig {
  active_layer?: WorkspaceLayerSelection;
  default_layer?: WorkspaceLayer;
  repository_layers?: Record<string, WorkspaceLayer>;
}

export interface IResolvedWorkspaceLayer {
  layer: WorkspaceLayer;
  repositoryIdentity?: string;
  source: "active-layer" | "repository-map" | "default";
}

export class RepositoryLayerConfigError extends Error {
  readonly failures: string[];

  constructor(failures: string[]) {
    super(
      `Workspace repository-layer configuration failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
    this.name = "RepositoryLayerConfigError";
    this.failures = failures;
  }
}

function parseRepositoryIdentity(remote: string): string | undefined {
  const normalized = remote.trim().replace(/\.git$/, "");
  const match = normalized.match(/(?:github\.com[/:])([^/]+\/[^/]+)$/);
  return match?.[1];
}

export function resolveRepositoryIdentity(
  repositoryRoot: string,
): string | undefined {
  const result = spawnSync("git", ["config", "--get", "remote.origin.url"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  const fromOrigin =
    result.status === 0 ? parseRepositoryIdentity(result.stdout) : undefined;
  if (fromOrigin) return fromOrigin;

  const fromEnvironment =
    process.env.TARGET_REPO ?? process.env.GITHUB_REPOSITORY;
  return fromEnvironment?.includes("/") ? fromEnvironment : undefined;
}

export function readWorkspaceConfig(repositoryRoot: string): IWorkspaceConfig {
  const workspaceRoot = path.join(repositoryRoot, "apps/studio/workspace");
  const failures: string[] = [];
  const configPath = path.join(workspaceRoot, "utils/config.yaml");
  const localPath = path.join(workspaceRoot, "utils/config.local.yaml");
  const parseConfig = (sourcePath: string) => {
    if (!existsSync(sourcePath)) return {} as Record<string, unknown>;
    const parsed = parse(readFileSync(sourcePath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      failures.push(`${sourcePath} must contain a YAML object`);
      return {} as Record<string, unknown>;
    }
    return parsed as Record<string, unknown>;
  };
  const committed = parseConfig(configPath) as IWorkspaceConfig;
  const local = parseConfig(localPath);
  const unexpectedLocalKeys = Object.keys(local).filter(
    (key) => key !== "active_layer",
  );
  if (unexpectedLocalKeys.length > 0) {
    failures.push(
      `${localPath} may define only active_layer; found ${unexpectedLocalKeys.join(", ")}`,
    );
  }
  const merged: IWorkspaceConfig = {
    ...committed,
    ...(local.active_layer == null
      ? {}
      : { active_layer: local.active_layer as WorkspaceLayerSelection }),
  };

  if (
    merged.active_layer != null &&
    !["auto", "singlepage", "startup"].includes(merged.active_layer)
  ) {
    failures.push(
      "workspace config active_layer must be auto, singlepage, or startup",
    );
  }
  if (
    merged.default_layer != null &&
    !["singlepage", "startup"].includes(merged.default_layer)
  ) {
    failures.push(
      "workspace config default_layer must be singlepage or startup",
    );
  }
  for (const [repository, layer] of Object.entries(
    merged.repository_layers ?? {},
  )) {
    if (
      !repository.includes("/") ||
      !["singlepage", "startup"].includes(layer)
    ) {
      failures.push(
        `workspace config repository_layers has invalid mapping ${repository}: ${layer}`,
      );
    }
  }
  if (failures.length) throw new RepositoryLayerConfigError(failures);
  return merged;
}

export function resolveWorkspaceLayer(options: {
  repositoryRoot: string;
  requestedLayer?: WorkspaceLayerSelection;
  repositoryIdentity?: string;
}): IResolvedWorkspaceLayer {
  const config = readWorkspaceConfig(options.repositoryRoot);
  const repositoryIdentity =
    options.repositoryIdentity ??
    resolveRepositoryIdentity(options.repositoryRoot);

  if (
    options.requestedLayer === "singlepage" ||
    options.requestedLayer === "startup"
  ) {
    return {
      layer: options.requestedLayer,
      repositoryIdentity,
      source: "active-layer",
    };
  }

  const configuredRepositoryLayer = repositoryIdentity
    ? config.repository_layers?.[repositoryIdentity]
    : undefined;
  const repositoryLayer = repositoryIdentity
    ? (configuredRepositoryLayer ?? config.default_layer ?? "startup")
    : undefined;
  const localLayer =
    config.active_layer === "singlepage" || config.active_layer === "startup"
      ? config.active_layer
      : undefined;

  if (repositoryLayer) {
    if (localLayer && localLayer !== repositoryLayer) {
      throw new RepositoryLayerConfigError([
        `config.local.yaml active_layer ${localLayer} conflicts with repository ${repositoryIdentity} resolved as ${repositoryLayer}`,
      ]);
    }
    return {
      layer: repositoryLayer,
      repositoryIdentity,
      source: configuredRepositoryLayer ? "repository-map" : "default",
    };
  }

  if (localLayer) {
    return {
      layer: localLayer,
      repositoryIdentity,
      source: "active-layer",
    };
  }

  return {
    layer: config.default_layer ?? "startup",
    repositoryIdentity,
    source: "default",
  };
}
