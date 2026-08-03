import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

export type WorkspaceLayer = "singlepage" | "startup";
export type WorkspaceLayerSelection = WorkspaceLayer | "auto";

export interface IWorkspaceIndexEntry {
  id: string;
  kind: string;
  path: string;
  description: string;
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
  inherited: boolean;
  layer: WorkspaceLayer;
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
  repositoryIdentity?: string;
  repositoryRoot?: string;
  requestedIds?: string[];
  singlepageRoot?: string;
  startupRoot?: string;
  workspaceRoot?: string;
}

interface IWorkspaceConfig {
  active_layer?: WorkspaceLayerSelection;
  canonical_repository?: string;
  workspace_root?: string;
}

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
    return {
      id: typeof entry.id === "string" ? entry.id : "",
      kind: typeof entry.kind === "string" ? entry.kind : "",
      path: typeof entry.path === "string" ? entry.path : "",
      description:
        typeof entry.description === "string" ? entry.description : "",
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
  layerRoot: string,
  layer: WorkspaceLayer,
): Promise<IWorkspaceIndex> {
  const indexPath = path.join(layerRoot, "index.yaml");
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
  const localPath = path.join(repositoryRoot, "workspace", "config.local.yaml");
  const examplePath = path.join(
    repositoryRoot,
    "workspace",
    "config.example.yaml",
  );
  const selectedPath = existsSync(localPath) ? localPath : examplePath;
  if (!existsSync(selectedPath)) return {};
  const parsed = parseYaml(await readFile(selectedPath, "utf8"), selectedPath);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as IWorkspaceConfig)
    : {};
}

function resolveEntryPath(
  layerRoot: string,
  entry: IWorkspaceIndexEntry,
  failures: string[],
): string {
  const absolutePath = path.resolve(layerRoot, entry.path);
  const relativePath = path.relative(layerRoot, absolutePath);
  if (
    !entry.path ||
    path.isAbsolute(entry.path) ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    failures.push(
      `${entry.id || "<unknown>"}: path must stay inside its layer root (${entry.path})`,
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

export async function loadWorkspace(
  options: ILoadWorkspaceOptions = {},
): Promise<IWorkspaceGraph> {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd());
  const config = await readConfig(repositoryRoot);
  const canonicalWorkspaceRoot = path.join(repositoryRoot, "workspace");
  const workspaceRoot = path.resolve(
    options.workspaceRoot ??
      path.join(repositoryRoot, config.workspace_root ?? "workspace"),
  );
  const singlepageRoot = path.resolve(
    options.singlepageRoot ?? path.join(canonicalWorkspaceRoot, "singlepage"),
  );
  const startupRoot = path.resolve(
    options.startupRoot ?? path.join(workspaceRoot, "startup"),
  );
  const explicitWorkspace =
    options.workspaceRoot != null || options.startupRoot != null;
  const requestedLayer = options.activeLayer ?? config.active_layer ?? "auto";
  const repositoryIdentity =
    options.repositoryIdentity ?? resolveRepositoryIdentity(repositoryRoot);
  const canonicalRepository =
    config.canonical_repository ?? "singlepagestartup/singlepagestartup";
  const activeLayer: WorkspaceLayer =
    requestedLayer === "singlepage" || requestedLayer === "startup"
      ? requestedLayer
      : explicitWorkspace
        ? "startup"
        : repositoryIdentity === canonicalRepository
          ? "singlepage"
          : "startup";

  const [singlepageIndex, startupIndex] = await Promise.all([
    readIndex(singlepageRoot, "singlepage"),
    readIndex(startupRoot, "startup"),
  ]);
  const failures: string[] = [];
  const allIds = new Map<string, string>();

  function resolveEntries(
    index: IWorkspaceIndex,
    layerRoot: string,
    inherited: boolean,
  ) {
    return index.entries.map((entry) => {
      const previous = allIds.get(entry.id);
      if (previous)
        failures.push(
          `${entry.id}: duplicate ID in ${previous} and ${index.layer}`,
        );
      else allIds.set(entry.id, index.layer);
      return {
        ...entry,
        absolutePath: resolveEntryPath(layerRoot, entry, failures),
        inherited,
        layer: index.layer,
      } satisfies IResolvedWorkspaceEntry;
    });
  }

  const singlepageEntries = resolveEntries(
    singlepageIndex,
    singlepageRoot,
    activeLayer === "startup",
  );
  const startupEntries = resolveEntries(startupIndex, startupRoot, false);
  const singlepageById = new Map(
    singlepageEntries.map((entry) => [entry.id, entry]),
  );
  const startupById = new Map(startupEntries.map((entry) => [entry.id, entry]));
  const exportSet = new Set(singlepageIndex.exports);
  const importSet = new Set(startupIndex.imports);

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
      if (!startupById.has(dependency) && !importSet.has(dependency)) {
        failures.push(
          `${entry.id}: broken or non-imported uses reference ${dependency}`,
        );
      }
    }
  }

  const visibleEntries =
    activeLayer === "singlepage"
      ? singlepageEntries.map((entry) => ({ ...entry, inherited: false }))
      : [
          ...startupEntries,
          ...singlepageEntries.filter((entry) => importSet.has(entry.id)),
        ];
  const visibleById = new Map(visibleEntries.map((entry) => [entry.id, entry]));
  for (const cycle of findCycles(visibleEntries))
    failures.push(`dependency cycle: ${cycle}`);

  const requestedIds = options.requestedIds?.length
    ? [...new Set(options.requestedIds)]
    : visibleEntries.map((entry) => entry.id);
  for (const id of requestedIds) {
    if (!visibleById.has(id))
      failures.push(`requested ID is not visible in ${activeLayer}: ${id}`);
  }
  if (failures.length)
    throw new WorkspaceValidationError([...new Set(failures)].sort());

  const dependencyClosure = computeClosure(visibleById, requestedIds);
  const loadedEntries = await Promise.all(
    dependencyClosure.map(async (id) => {
      const entry = visibleById.get(id)!;
      return { ...entry, content: await readFile(entry.absolutePath, "utf8") };
    }),
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
