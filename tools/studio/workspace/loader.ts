import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import { mergeWorkspaceContent, type WorkspaceMergeStrategy } from "./merge";

export type WorkspaceLayer = "singlepage" | "startup";
export type WorkspaceLayerSelection = WorkspaceLayer | "auto";
export type WorkspaceProjection = "resolved" | "source";

export interface IWorkspaceIndexEntry {
  id: string;
  kind: string;
  path: string;
  description: string;
  extends?: string;
  strategy?: WorkspaceMergeStrategy;
  uses: string[];
}

export interface IWorkspaceIndex {
  schema: string;
  layer: WorkspaceLayer;
  entries: IWorkspaceIndexEntry[];
  exports: string[];
  imports: string[];
}

export interface IResolvedWorkspaceEntry extends IWorkspaceIndexEntry {
  absolutePath: string;
  baseAbsolutePath?: string;
  overlayAbsolutePath?: string;
  inherited: boolean;
  layer: WorkspaceLayer;
  resolution: "local" | "inherited" | "merged";
  sourceIds: string[];
  sourcePaths: string[];
}

export interface ILoadedWorkspaceEntry extends IResolvedWorkspaceEntry {
  content: string;
}

export interface IWorkspaceGraph {
  activeLayer: WorkspaceLayer;
  workspaceRoot: string;
  visibleEntries: IResolvedWorkspaceEntry[];
  loadedEntries: ILoadedWorkspaceEntry[];
  dependencyClosure: string[];
  reverseDependencies: Record<string, string[]>;
  imports: string[];
  exports: string[];
}

export interface ILoadWorkspaceOptions {
  activeLayer?: WorkspaceLayerSelection;
  projection?: WorkspaceProjection;
  repositoryIdentity?: string;
  repositoryRoot?: string;
  requestedIds?: string[];
  workspaceRoot?: string;
}

interface IWorkspaceConfig {
  active_layer?: WorkspaceLayerSelection;
  default_layer?: WorkspaceLayer;
  repository_layers?: Record<string, WorkspaceLayer>;
}

const LAYERED_ENTRY_KINDS = [
  "brief",
  "evidence",
  "business",
  "research",
  "strategy",
  "asset-index",
  "brand",
  "website",
  "discovery",
  "acquisition",
  "communication",
  "decision-profile",
] as const;

const LAYERED_ENTRY_KIND_SET = new Set<string>(LAYERED_ENTRY_KINDS);
const STUDIO_WORKSPACE_ROOT = "apps/studio/workspace";
const AGENT_RESOURCE_ROOT = ".agents";
const WORKSPACE_MERGE_STRATEGIES = new Set<WorkspaceMergeStrategy>([
  "keyed",
  "replace",
  "scoped-keyed",
  "sections",
]);
const EXPECTED_LAYERED_STRATEGIES: Record<string, WorkspaceMergeStrategy> = {
  acquisition: "replace",
  "asset-index": "keyed",
  brand: "sections",
  brief: "sections",
  business: "sections",
  communication: "replace",
  "decision-profile": "replace",
  discovery: "replace",
  evidence: "scoped-keyed",
  research: "sections",
  strategy: "sections",
  website: "sections",
};

export class WorkspaceValidationError extends Error {
  readonly failures: string[];

  constructor(failures: string[]) {
    super(
      `Workspace validation failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
    this.name = "WorkspaceValidationError";
    this.failures = failures;
  }
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function parseYaml(source: string, sourcePath: string): unknown {
  try {
    return parse(source);
  } catch (error) {
    throw new WorkspaceValidationError([
      `${toPosix(sourcePath)}: invalid YAML (${error instanceof Error ? error.message : String(error)})`,
    ]);
  }
}

function stringList(
  value: unknown,
  field: string,
  failures: string[],
): string[] {
  if (!Array.isArray(value)) {
    failures.push(`${field} must be an array`);
    return [];
  }

  const values = value.filter(
    (item): item is string => typeof item === "string",
  );
  if (values.length !== value.length)
    failures.push(`${field} must contain only strings`);
  return values;
}

function parseIndex(
  raw: unknown,
  indexPath: string,
  expectedLayer: WorkspaceLayer,
): IWorkspaceIndex {
  const failures: string[] = [];
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const entriesRaw = Array.isArray(value.entries) ? value.entries : [];
  if (!Array.isArray(value.entries))
    failures.push(`${toPosix(indexPath)}: entries must be an array`);

  const entries = entriesRaw.map((entryRaw, entryIndex) => {
    const entry =
      entryRaw && typeof entryRaw === "object" && !Array.isArray(entryRaw)
        ? (entryRaw as Record<string, unknown>)
        : {};
    const prefix = `${toPosix(indexPath)}: entries[${entryIndex}]`;
    for (const field of ["id", "kind", "path", "description"] as const) {
      if (typeof entry[field] !== "string" || !entry[field]) {
        failures.push(`${prefix}.${field} must be a non-empty string`);
      }
    }
    const extendedId =
      typeof entry.extends === "string" && entry.extends
        ? entry.extends
        : undefined;
    if (entry.extends != null && !extendedId) {
      failures.push(`${prefix}.extends must be a non-empty string`);
    }
    const strategy =
      typeof entry.strategy === "string" &&
      WORKSPACE_MERGE_STRATEGIES.has(entry.strategy as WorkspaceMergeStrategy)
        ? (entry.strategy as WorkspaceMergeStrategy)
        : undefined;
    if (entry.strategy != null && !strategy) {
      failures.push(
        `${prefix}.strategy must be keyed, replace, scoped-keyed, or sections`,
      );
    }
    return {
      id: typeof entry.id === "string" ? entry.id : "",
      kind: typeof entry.kind === "string" ? entry.kind : "",
      path: typeof entry.path === "string" ? entry.path : "",
      description:
        typeof entry.description === "string" ? entry.description : "",
      extends: extendedId,
      strategy,
      uses: stringList(entry.uses, `${prefix}.uses`, failures),
    } satisfies IWorkspaceIndexEntry;
  });

  if (typeof value.schema !== "string" || !value.schema) {
    failures.push(`${toPosix(indexPath)}: schema must be a non-empty string`);
  }
  if (value.layer !== expectedLayer) {
    failures.push(`${toPosix(indexPath)}: layer must be ${expectedLayer}`);
  }
  const exports = stringList(
    value.exports,
    `${toPosix(indexPath)}: exports`,
    failures,
  );
  const imports = stringList(
    value.imports,
    `${toPosix(indexPath)}: imports`,
    failures,
  );

  if (failures.length) throw new WorkspaceValidationError(failures);
  return {
    schema: value.schema as string,
    layer: expectedLayer,
    entries,
    exports,
    imports,
  };
}

async function readIndex(
  workspaceRoot: string,
  layer: WorkspaceLayer,
): Promise<IWorkspaceIndex> {
  const indexPath = path.join(workspaceRoot, "index", `${layer}.yaml`);
  if (!existsSync(indexPath)) {
    throw new WorkspaceValidationError([
      `${toPosix(indexPath)}: index file does not exist`,
    ]);
  }
  return parseIndex(
    parseYaml(await readFile(indexPath, "utf8"), indexPath),
    indexPath,
    layer,
  );
}

function parseRepositoryIdentity(remote: string): string | undefined {
  const normalized = remote.trim().replace(/\.git$/, "");
  const match = normalized.match(/(?:github\.com[/:])([^/]+\/[^/]+)$/);
  return match?.[1];
}

export function resolveRepositoryIdentity(
  repositoryRoot: string,
): string | undefined {
  const fromEnvironment =
    process.env.TARGET_REPO ?? process.env.GITHUB_REPOSITORY;
  if (fromEnvironment?.includes("/")) return fromEnvironment;

  const result = spawnSync("git", ["config", "--get", "remote.origin.url"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  return result.status === 0
    ? parseRepositoryIdentity(result.stdout)
    : undefined;
}

async function readConfig(repositoryRoot: string): Promise<IWorkspaceConfig> {
  const workspaceRoot = path.join(repositoryRoot, STUDIO_WORKSPACE_ROOT);
  const configPath = path.join(workspaceRoot, "config.yaml");
  const localPath = path.join(workspaceRoot, "config.local.yaml");
  const sources = await Promise.all(
    [configPath, localPath]
      .filter((sourcePath) => existsSync(sourcePath))
      .map(async (sourcePath) => ({
        parsed: parseYaml(await readFile(sourcePath, "utf8"), sourcePath),
        sourcePath,
      })),
  );
  const merged: IWorkspaceConfig = {};
  for (const { parsed } of sources) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      continue;
    Object.assign(merged, parsed as IWorkspaceConfig);
  }
  const failures: string[] = [];
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
  if (failures.length) throw new WorkspaceValidationError(failures);
  return merged;
}

function resolveEntryPath(
  workspaceRoot: string,
  entry: IWorkspaceIndexEntry,
  failures: string[],
  repositoryRoot: string,
): string {
  const normalizedPath = toPosix(entry.path);
  const isAgentResourcePath = normalizedPath.startsWith(
    `${AGENT_RESOURCE_ROOT}/`,
  );
  const mayUseAgentResourcePath =
    isAgentResourcePath &&
    (entry.kind === "knowledge" || entry.kind === "template");
  const sourceRoot = mayUseAgentResourcePath
    ? path.join(repositoryRoot, AGENT_RESOURCE_ROOT)
    : workspaceRoot;
  const absolutePath = mayUseAgentResourcePath
    ? path.resolve(repositoryRoot, entry.path)
    : path.resolve(workspaceRoot, entry.path);
  const relativePath = path.relative(sourceRoot, absolutePath);
  if (isAgentResourcePath && !mayUseAgentResourcePath) {
    failures.push(
      `${entry.id || "<unknown>"}: only shared knowledge and templates may use ${AGENT_RESOURCE_ROOT} (${entry.path})`,
    );
  }
  if (
    !entry.path ||
    path.isAbsolute(entry.path) ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    failures.push(
      `${entry.id || "<unknown>"}: path must stay inside its declared source root (${entry.path})`,
    );
  } else if (!existsSync(absolutePath)) {
    failures.push(
      `${entry.id}: declared file does not exist (${toPosix(absolutePath)})`,
    );
  }
  return absolutePath;
}

function findCycles(entries: IResolvedWorkspaceEntry[]): string[] {
  const edges = new Map(entries.map((entry) => [entry.id, entry.uses]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stack: string[] = [];
  const cycles = new Set<string>();

  function visit(id: string) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.add([...stack.slice(start), id].join(" -> "));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    for (const dependency of edges.get(id) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of edges.keys()) visit(id);
  return [...cycles].sort();
}

function computeClosure(
  entries: Map<string, IResolvedWorkspaceEntry>,
  requestedIds: string[],
): string[] {
  const closure = new Set<string>();
  function add(id: string) {
    if (closure.has(id)) return;
    closure.add(id);
    for (const dependency of entries.get(id)?.uses ?? []) add(dependency);
  }
  for (const id of requestedIds) add(id);
  return [...closure].sort();
}

function computeReverseDependencies(
  entries: IResolvedWorkspaceEntry[],
): Record<string, string[]> {
  const reverse = Object.fromEntries(
    entries.map((entry) => [entry.id, [] as string[]]),
  );
  for (const entry of entries) {
    for (const dependency of entry.uses) reverse[dependency]?.push(entry.id);
  }
  for (const values of Object.values(reverse)) values.sort();
  return reverse;
}

function validateEvidenceContent(
  source: string,
  layer: WorkspaceLayer,
  sourcePath: string,
): void {
  if (!source.trim()) return;
  const rows = source
    .split("\n")
    .filter((line) => line.trimStart().startsWith("|"));
  if (rows.length < 2) {
    throw new WorkspaceValidationError([
      `${toPosix(sourcePath)}: evidence must contain a Markdown table`,
    ]);
  }
  const cells = (row: string) =>
    row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  const header = cells(rows[0]);
  const scopeIndex = header.indexOf("Scope");
  const stateIndex = header.indexOf("State");
  const idIndex = header.indexOf("ID");
  if (idIndex < 0 || scopeIndex < 0 || stateIndex < 0) {
    throw new WorkspaceValidationError([
      `${toPosix(sourcePath)}: evidence columns must include ID, Scope, and State`,
    ]);
  }
  const failures: string[] = [];
  for (const row of rows.slice(2)) {
    const values = cells(row);
    if (!values.some(Boolean)) continue;
    const id = values[idIndex] || "<missing ID>";
    const scope = values[scopeIndex];
    const state = values[stateIndex];
    if (![layer, "shared"].includes(scope)) {
      failures.push(
        `${toPosix(sourcePath)}: ${id} scope must be ${layer} or shared`,
      );
    }
    if (!["active", "not-applicable", "superseded"].includes(state)) {
      failures.push(
        `${toPosix(sourcePath)}: ${id} has invalid evidence state ${state || "<empty>"}`,
      );
    }
  }
  if (failures.length) throw new WorkspaceValidationError(failures);
}

async function loadEntryContent(
  entry: IResolvedWorkspaceEntry,
): Promise<ILoadedWorkspaceEntry> {
  if (entry.baseAbsolutePath && entry.overlayAbsolutePath) {
    const [base, overlay] = await Promise.all([
      readFile(entry.baseAbsolutePath, "utf8"),
      readFile(entry.overlayAbsolutePath, "utf8"),
    ]);
    if (entry.kind === "evidence") {
      validateEvidenceContent(base, "singlepage", entry.baseAbsolutePath);
      validateEvidenceContent(overlay, "startup", entry.overlayAbsolutePath);
    }
    const merged = mergeWorkspaceContent({
      base,
      kind: entry.kind,
      overlay,
      sourcePath: entry.overlayAbsolutePath,
      strategy: entry.strategy,
    });
    return {
      ...entry,
      absolutePath: merged.overlayContributes
        ? entry.overlayAbsolutePath
        : entry.baseAbsolutePath,
      content: merged.content,
      inherited: !merged.overlayContributes,
      resolution: merged.overlayContributes ? "merged" : "inherited",
    };
  }
  const content = await readFile(entry.absolutePath, "utf8");
  if (entry.kind === "evidence") {
    validateEvidenceContent(content, entry.layer, entry.absolutePath);
  }
  return {
    ...entry,
    content,
  };
}

export async function loadWorkspace(
  options: ILoadWorkspaceOptions = {},
): Promise<IWorkspaceGraph> {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd());
  const config = await readConfig(repositoryRoot);
  const canonicalWorkspaceRoot = path.join(
    repositoryRoot,
    STUDIO_WORKSPACE_ROOT,
  );
  const workspaceRoot = path.resolve(
    options.workspaceRoot ?? canonicalWorkspaceRoot,
  );
  const requestedLayer = options.activeLayer ?? config.active_layer ?? "auto";
  const repositoryIdentity =
    options.repositoryIdentity ?? resolveRepositoryIdentity(repositoryRoot);
  const configuredRepositoryLayer = repositoryIdentity
    ? config.repository_layers?.[repositoryIdentity]
    : undefined;
  const activeLayer: WorkspaceLayer =
    requestedLayer === "singlepage" || requestedLayer === "startup"
      ? requestedLayer
      : (configuredRepositoryLayer ?? config.default_layer ?? "startup");
  const projection = options.projection ?? "resolved";

  const [singlepageIndex, startupIndex] = await Promise.all([
    readIndex(workspaceRoot, "singlepage"),
    readIndex(workspaceRoot, "startup"),
  ]);
  const failures: string[] = [];
  const allIds = new Map<string, string>();

  function resolveEntries(index: IWorkspaceIndex, inherited: boolean) {
    return index.entries.map((entry) => {
      const previous = allIds.get(entry.id);
      if (previous)
        failures.push(
          `${entry.id}: duplicate ID in ${previous} and ${index.layer}`,
        );
      else allIds.set(entry.id, index.layer);
      const absolutePath = resolveEntryPath(
        workspaceRoot,
        entry,
        failures,
        repositoryRoot,
      );
      return {
        ...entry,
        absolutePath,
        inherited,
        layer: index.layer,
        resolution: inherited ? "inherited" : "local",
        sourceIds: [entry.id],
        sourcePaths: [absolutePath],
      } satisfies IResolvedWorkspaceEntry;
    });
  }

  const singlepageEntries = resolveEntries(
    singlepageIndex,
    activeLayer === "startup",
  );
  const startupEntries = resolveEntries(startupIndex, false);
  const singlepageById = new Map(
    singlepageEntries.map((entry) => [entry.id, entry]),
  );
  const startupById = new Map(startupEntries.map((entry) => [entry.id, entry]));
  const exportSet = new Set(singlepageIndex.exports);
  const importSet = new Set(startupIndex.imports);
  const singlepageLayeredByKind = new Map<string, IResolvedWorkspaceEntry>();
  const startupLayeredByKind = new Map<string, IResolvedWorkspaceEntry>();

  function indexLayeredEntries(
    entries: IResolvedWorkspaceEntry[],
    target: Map<string, IResolvedWorkspaceEntry>,
  ) {
    for (const entry of entries) {
      if (!LAYERED_ENTRY_KIND_SET.has(entry.kind)) continue;
      const previous = target.get(entry.kind);
      if (previous) {
        failures.push(
          `${entry.layer}: multiple ${entry.kind} layered entries (${previous.id}, ${entry.id})`,
        );
      } else target.set(entry.kind, entry);
    }
  }

  indexLayeredEntries(singlepageEntries, singlepageLayeredByKind);
  indexLayeredEntries(startupEntries, startupLayeredByKind);

  for (const entry of singlepageEntries) {
    if (entry.extends || entry.strategy) {
      failures.push(
        `${entry.id}: singlepage sources cannot declare extends or strategy`,
      );
    }
  }
  for (const entry of startupEntries) {
    const isLayered = LAYERED_ENTRY_KIND_SET.has(entry.kind);
    if (!isLayered && (entry.extends || entry.strategy)) {
      failures.push(
        `${entry.id}: only layered startup sources may declare extends or strategy`,
      );
      continue;
    }
    if (!isLayered) continue;
    const base = entry.extends ? singlepageById.get(entry.extends) : undefined;
    if (!entry.extends || !base) {
      failures.push(
        `${entry.id}: extends must reference its singlepage source`,
      );
    } else if (base.kind !== entry.kind) {
      failures.push(
        `${entry.id}: cannot extend ${base.id} with different kind ${base.kind}`,
      );
    }
    const expectedStrategy = EXPECTED_LAYERED_STRATEGIES[entry.kind];
    if (entry.strategy !== expectedStrategy) {
      failures.push(
        `${entry.id}: strategy must be ${expectedStrategy ?? "declared"}`,
      );
    }
  }

  for (const id of singlepageIndex.exports) {
    if (!singlepageById.has(id))
      failures.push(`singlepage export does not exist: ${id}`);
  }
  for (const id of startupIndex.imports) {
    if (!exportSet.has(id))
      failures.push(`startup import is not exported by singlepage: ${id}`);
    if (!singlepageById.has(id))
      failures.push(`startup import does not exist: ${id}`);
  }
  for (const entry of singlepageEntries) {
    for (const dependency of entry.uses) {
      if (!singlepageById.has(dependency))
        failures.push(`${entry.id}: broken uses reference ${dependency}`);
      if (exportSet.has(entry.id) && !exportSet.has(dependency)) {
        failures.push(
          `${entry.id}: exported entry depends on non-exported ${dependency}`,
        );
      }
    }
  }
  for (const entry of startupEntries) {
    for (const dependency of entry.uses) {
      const layeredSinglepageDependency =
        singlepageById.has(dependency) &&
        LAYERED_ENTRY_KIND_SET.has(singlepageById.get(dependency)!.kind);
      if (
        !startupById.has(dependency) &&
        !importSet.has(dependency) &&
        !layeredSinglepageDependency
      ) {
        failures.push(
          `${entry.id}: broken or non-imported uses reference ${dependency}`,
        );
      }
    }
  }

  const effectiveAliases = new Map<string, string>();
  let visibleEntries: IResolvedWorkspaceEntry[];
  if (activeLayer === "singlepage") {
    visibleEntries = singlepageEntries.map((entry) => ({
      ...entry,
      inherited: false,
      resolution: "local",
    }));
  } else if (projection === "source") {
    const importedSupportEntries = singlepageEntries
      .filter(
        (entry) =>
          !LAYERED_ENTRY_KIND_SET.has(entry.kind) && importSet.has(entry.id),
      )
      .map((entry) => ({
        ...entry,
        inherited: true,
        resolution: "inherited" as const,
      }));
    visibleEntries = [...startupEntries, ...importedSupportEntries];
  } else {
    const resolvedLayeredEntries: IResolvedWorkspaceEntry[] = [];
    const layeredPairs: Array<{
      base?: IResolvedWorkspaceEntry;
      overlay?: IResolvedWorkspaceEntry;
      resolved: IResolvedWorkspaceEntry;
    }> = [];
    for (const kind of LAYERED_ENTRY_KINDS) {
      const base = singlepageLayeredByKind.get(kind);
      const overlay = startupLayeredByKind.get(kind);
      if (!base && !overlay) continue;
      const selected = overlay ?? base!;
      const resolved: IResolvedWorkspaceEntry = {
        ...selected,
        absolutePath: overlay?.absolutePath ?? base!.absolutePath,
        baseAbsolutePath: base?.absolutePath,
        overlayAbsolutePath: overlay?.absolutePath,
        inherited: !overlay,
        layer: overlay?.layer ?? base!.layer,
        resolution: overlay ? (base ? "merged" : "local") : "inherited",
        sourceIds: [base?.id, overlay?.id].filter((id): id is string =>
          Boolean(id),
        ),
        sourcePaths: [base?.absolutePath, overlay?.absolutePath].filter(
          (sourcePath): sourcePath is string => Boolean(sourcePath),
        ),
      };
      if (base) effectiveAliases.set(base.id, resolved.id);
      if (overlay) effectiveAliases.set(overlay.id, resolved.id);
      layeredPairs.push({ base, overlay, resolved });
    }
    for (const pair of layeredPairs) {
      pair.resolved.uses = [
        ...new Set(
          [...(pair.base?.uses ?? []), ...(pair.overlay?.uses ?? [])].map(
            (dependency) => effectiveAliases.get(dependency) ?? dependency,
          ),
        ),
      ];
      resolvedLayeredEntries.push(pair.resolved);
    }

    const startupSupportEntries = startupEntries.filter(
      (entry) => !LAYERED_ENTRY_KIND_SET.has(entry.kind),
    );
    const inheritedSupportEntries = singlepageEntries
      .filter(
        (entry) =>
          !LAYERED_ENTRY_KIND_SET.has(entry.kind) && importSet.has(entry.id),
      )
      .map((entry) => ({
        ...entry,
        inherited: true,
        resolution: "inherited" as const,
      }));
    visibleEntries = [
      ...resolvedLayeredEntries,
      ...startupSupportEntries,
      ...inheritedSupportEntries,
    ];
  }
  const visibleById = new Map(visibleEntries.map((entry) => [entry.id, entry]));
  for (const cycle of findCycles(visibleEntries))
    failures.push(`dependency cycle: ${cycle}`);

  const requestedIds = options.requestedIds?.length
    ? [
        ...new Set(
          options.requestedIds.map((id) => effectiveAliases.get(id) ?? id),
        ),
      ]
    : visibleEntries.map((entry) => entry.id);
  for (const id of requestedIds) {
    if (!visibleById.has(id))
      failures.push(`requested ID is not visible in ${activeLayer}: ${id}`);
  }
  if (failures.length)
    throw new WorkspaceValidationError([...new Set(failures)].sort());

  const dependencyClosure = computeClosure(visibleById, requestedIds);
  const loadedEntries = await Promise.all(
    dependencyClosure.map((id) => loadEntryContent(visibleById.get(id)!)),
  );

  return {
    activeLayer,
    workspaceRoot,
    visibleEntries: visibleEntries.sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    loadedEntries,
    dependencyClosure,
    reverseDependencies: computeReverseDependencies(visibleEntries),
    imports: [...startupIndex.imports].sort(),
    exports: [...singlepageIndex.exports].sort(),
  };
}
