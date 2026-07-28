import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

export interface DraftRunConfig {
  dev?: string;
  install?: string;
  autoInstall?: boolean;
  cwd?: string;
  port?: number;
  host?: string;
}

export interface DraftManifest {
  $schema?: string;
  id: string;
  title: string;
  description?: string;
  type: "html" | "react" | "next";
  entry: string;
  scope: "singlepage" | "startup";
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  run?: DraftRunConfig;
}

export interface DraftRecord {
  scope: string;
  draftDir: string;
  relativeDir: string;
  manifestPath: string;
  manifest: DraftManifest;
}

export interface InvalidDraftRecord {
  scope: string;
  draftDir: string;
  relativeDir: string;
  manifestPath: string;
  error: string;
}

export const ROOT = process.cwd();
export const DRAFTS_DIR = path.join(ROOT, "apps", "drafts");
export const RUNNABLE_DRAFTS_DIR = path.join(DRAFTS_DIR, "runnable");
export const SCOPES = ["singlepage", "startup"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".nx",
  "design-system",
  "foundations",
  "inventory",
  "modules",
  "runtime",
  ".storybook",
]);

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

async function walkForManifests(dir: string, output: string[]): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      await walkForManifests(entryPath, output);
      continue;
    }

    if (entry.isFile() && entry.name === "manifest.json") {
      output.push(entryPath);
    }
  }
}

export async function discoverManifestPaths(
  scopes: string[] = SCOPES,
): Promise<string[]> {
  const manifestPaths: string[] = [];

  await Promise.all(
    scopes.map(async (scope) => {
      const baseDir = path.join(RUNNABLE_DRAFTS_DIR, scope);
      await walkForManifests(baseDir, manifestPaths);
    }),
  );

  const scopeRootManifests = new Set(
    scopes.map((scope) =>
      path.join(RUNNABLE_DRAFTS_DIR, scope, "manifest.json"),
    ),
  );

  return manifestPaths
    .filter((manifestPath) => !scopeRootManifests.has(manifestPath))
    .sort((left, right) => left.localeCompare(right));
}

export async function readManifest(
  manifestPath: string,
): Promise<DraftManifest> {
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as DraftManifest;
}

export function normalizeDraftReference(value: unknown): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  return value
    .trim()
    .replace(/^apps\/drafts\//, "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export async function discoverDrafts({
  scopes = SCOPES,
}: {
  scopes?: string[];
} = {}): Promise<{
  drafts: DraftRecord[];
  invalidDrafts: InvalidDraftRecord[];
  manifestPaths: string[];
}> {
  const manifestPaths = await discoverManifestPaths(scopes);
  const drafts: DraftRecord[] = [];
  const invalidDrafts: InvalidDraftRecord[] = [];

  for (const manifestPath of manifestPaths) {
    const draftDir = path.dirname(manifestPath);
    const relativeDir = toPosixPath(path.relative(DRAFTS_DIR, draftDir));
    const segments = relativeDir.split("/");
    const scope = segments[1] ?? "";

    try {
      const manifest = await readManifest(manifestPath);
      drafts.push({
        scope,
        draftDir,
        relativeDir,
        manifestPath,
        manifest,
      });
    } catch (error) {
      invalidDrafts.push({
        scope,
        draftDir,
        relativeDir,
        manifestPath,
        error: String(error),
      });
    }
  }

  drafts.sort((left, right) =>
    left.relativeDir.localeCompare(right.relativeDir),
  );
  invalidDrafts.sort((left, right) =>
    left.relativeDir.localeCompare(right.relativeDir),
  );

  return {
    drafts,
    invalidDrafts,
    manifestPaths,
  };
}
