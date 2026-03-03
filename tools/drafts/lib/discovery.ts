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
  status: "incoming" | "approved" | "archived";
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  run?: DraftRunConfig;
}

export interface DraftRecord {
  collection: string;
  draftDir: string;
  relativeDir: string;
  manifestPath: string;
  manifest: DraftManifest;
}

export interface InvalidDraftRecord {
  collection: string;
  draftDir: string;
  relativeDir: string;
  manifestPath: string;
  error: string;
}

export const ROOT = process.cwd();
export const DRAFTS_DIR = path.join(ROOT, "apps", "drafts");
export const COLLECTIONS = ["incoming", "approved", "archived", "examples"];
const SKIP_DIRS = new Set(["node_modules", ".git", ".nx"]);

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
  collections: string[] = COLLECTIONS,
): Promise<string[]> {
  const manifestPaths: string[] = [];

  await Promise.all(
    collections.map(async (collection) => {
      const baseDir = path.join(DRAFTS_DIR, collection);
      await walkForManifests(baseDir, manifestPaths);
    }),
  );

  return manifestPaths.sort((left, right) => left.localeCompare(right));
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
  collections = COLLECTIONS,
}: {
  collections?: string[];
} = {}): Promise<{
  drafts: DraftRecord[];
  invalidDrafts: InvalidDraftRecord[];
  manifestPaths: string[];
}> {
  const manifestPaths = await discoverManifestPaths(collections);
  const drafts: DraftRecord[] = [];
  const invalidDrafts: InvalidDraftRecord[] = [];

  for (const manifestPath of manifestPaths) {
    const draftDir = path.dirname(manifestPath);
    const relativeDir = toPosixPath(path.relative(DRAFTS_DIR, draftDir));
    const [collection = ""] = relativeDir.split("/");

    try {
      const manifest = await readManifest(manifestPath);
      drafts.push({
        collection,
        draftDir,
        relativeDir,
        manifestPath,
        manifest,
      });
    } catch (error) {
      invalidDrafts.push({
        collection,
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
