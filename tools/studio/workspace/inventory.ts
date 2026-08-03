import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  loadWorkspace,
  type ILoadedWorkspaceEntry,
  type IWorkspaceGraph,
} from "./loader";

interface IArtifactRecord {
  id: string;
  kind: string;
  description: string;
  sourcePath: string;
  layer: "singlepage" | "startup";
  inherited: boolean;
  uses: string[];
  usedBy: string[];
  content: string;
}

interface IWorkspaceRecord {
  id: string;
  label: string;
  activeLayer: "singlepage" | "startup";
  workspaceRoot: string;
  imports: string[];
  exports: string[];
  artifacts: IArtifactRecord[];
}

interface IEngineeringRecord {
  kind: "research" | "plan";
  title: string;
  sourcePath: string;
  content: string;
}

interface IStudioWorkspaceInventory {
  schema: "singlepagestartup.studio-workspace-inventory.v1";
  generatedAt: string;
  workspaces: IWorkspaceRecord[];
  engineering: IEngineeringRecord[];
  totals: {
    workspaces: number;
    artifacts: number;
    engineeringResearch: number;
    engineeringPlans: number;
  };
}

const REPOSITORY_ROOT = process.cwd();
const OUTPUT_PATH = path.join(
  REPOSITORY_ROOT,
  "apps",
  "studio",
  "inventory",
  "workspace.generated.json",
);

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function repositoryPath(absolutePath: string): string {
  return toPosix(path.relative(REPOSITORY_ROOT, absolutePath));
}

function titleFromMarkdown(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

function artifactFromEntry(
  entry: ILoadedWorkspaceEntry,
  graph: IWorkspaceGraph,
): IArtifactRecord {
  return {
    id: entry.id,
    kind: entry.kind,
    description: entry.description,
    sourcePath: repositoryPath(entry.absolutePath),
    layer: entry.layer,
    inherited: entry.inherited,
    uses: [...entry.uses],
    usedBy: [...(graph.reverseDependencies[entry.id] ?? [])],
    content: entry.content,
  };
}

async function collectWorkspace(
  id: string,
  label: string,
  graphOptions: Parameters<typeof loadWorkspace>[0],
): Promise<IWorkspaceRecord> {
  const graph = await loadWorkspace(graphOptions);
  return {
    id,
    label,
    activeLayer: graph.activeLayer,
    workspaceRoot: repositoryPath(graph.workspaceRoot),
    imports: graph.imports,
    exports: graph.exports,
    artifacts: graph.loadedEntries
      .map((entry) => artifactFromEntry(entry, graph))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
}

async function walkMarkdown(
  directory: string,
  output: string[],
): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walkMarkdown(entryPath, output);
    else if (entry.isFile() && entry.name.endsWith(".md"))
      output.push(entryPath);
  }
}

async function collectEngineering(): Promise<IEngineeringRecord[]> {
  const roots = [
    ["research", path.join(REPOSITORY_ROOT, "thoughts", "shared", "research")],
    ["plan", path.join(REPOSITORY_ROOT, "thoughts", "shared", "plans")],
  ] as const;
  const records: IEngineeringRecord[] = [];

  for (const [kind, root] of roots) {
    const files: string[] = [];
    await walkMarkdown(root, files);
    for (const filePath of files.sort()) {
      const content = await readFile(filePath, "utf8");
      records.push({
        kind,
        title: titleFromMarkdown(content, path.basename(filePath, ".md")),
        sourcePath: repositoryPath(filePath),
        content,
      });
    }
  }

  return records;
}

async function collectExamples(): Promise<IWorkspaceRecord[]> {
  const examplesRoot = path.join(REPOSITORY_ROOT, "examples");
  let entries: Awaited<ReturnType<typeof readdir>> = [];
  try {
    entries = await readdir(examplesRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const workspaces: IWorkspaceRecord[] = [];
  for (const entry of entries
    .filter((candidate) => candidate.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))) {
    const workspaceRoot = path.join(examplesRoot, entry.name, "workspace");
    try {
      workspaces.push(
        await collectWorkspace(
          `example.${entry.name}`,
          entry.name
            .split("-")
            .map((part) => part[0]?.toUpperCase() + part.slice(1))
            .join(" "),
          {
            activeLayer: "startup",
            repositoryRoot: REPOSITORY_ROOT,
            workspaceRoot,
          },
        ),
      );
    } catch (error) {
      throw new Error(
        `Example workspace ${entry.name} is invalid: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return workspaces;
}

export async function collectStudioWorkspaceInventory(): Promise<IStudioWorkspaceInventory> {
  const [singlepage, startup, examples, engineering] = await Promise.all([
    collectWorkspace("singlepage", "SinglePageStartup", {
      activeLayer: "singlepage",
      repositoryRoot: REPOSITORY_ROOT,
    }),
    collectWorkspace("startup", "Startup scaffold", {
      activeLayer: "startup",
      repositoryRoot: REPOSITORY_ROOT,
    }),
    collectExamples(),
    collectEngineering(),
  ]);
  const workspaces = [singlepage, startup, ...examples];

  return {
    schema: "singlepagestartup.studio-workspace-inventory.v1",
    generatedAt: new Date().toISOString(),
    workspaces,
    engineering,
    totals: {
      workspaces: workspaces.length,
      artifacts: workspaces.reduce(
        (total, workspace) => total + workspace.artifacts.length,
        0,
      ),
      engineeringResearch: engineering.filter(
        (record) => record.kind === "research",
      ).length,
      engineeringPlans: engineering.filter((record) => record.kind === "plan")
        .length,
    },
  };
}

async function main(): Promise<void> {
  const inventory = await collectStudioWorkspaceInventory();
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(inventory, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Generated ${repositoryPath(OUTPUT_PATH)}: workspaces=${inventory.totals.workspaces} artifacts=${inventory.totals.artifacts} research=${inventory.totals.engineeringResearch} plans=${inventory.totals.engineeringPlans}`,
  );
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
