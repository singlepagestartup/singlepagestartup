import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

export interface StudioProjectRunConfig {
  dev?: string;
  install?: string;
  autoInstall?: boolean;
  cwd?: string;
  port?: number;
  host?: string;
}

export interface StudioProjectManifest {
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
  run?: StudioProjectRunConfig;
}

export interface StudioProjectRecord {
  scope: string;
  studioProjectDir: string;
  relativeDir: string;
  manifestPath: string;
  manifest: StudioProjectManifest;
}

export interface InvalidStudioProjectRecord {
  scope: string;
  studioProjectDir: string;
  relativeDir: string;
  manifestPath: string;
  error: string;
}

export const ROOT = process.cwd();
export const STUDIO_DIR = path.join(ROOT, "apps", "studio");
export const RUNNABLE_STUDIO_DIR = path.join(STUDIO_DIR, "runnable");
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
      const baseDir = path.join(RUNNABLE_STUDIO_DIR, scope);
      await walkForManifests(baseDir, manifestPaths);
    }),
  );

  const scopeRootManifests = new Set(
    scopes.map((scope) =>
      path.join(RUNNABLE_STUDIO_DIR, scope, "manifest.json"),
    ),
  );

  return manifestPaths
    .filter((manifestPath) => !scopeRootManifests.has(manifestPath))
    .sort((left, right) => left.localeCompare(right));
}

export async function readStudioProjectManifest(
  manifestPath: string,
): Promise<StudioProjectManifest> {
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as StudioProjectManifest;
}

export function normalizeStudioProjectReference(value: unknown): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  return value
    .trim()
    .replace(/^apps\/studio\//, "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export async function discoverStudioProjects({
  scopes = SCOPES,
}: {
  scopes?: string[];
} = {}): Promise<{
  studioProjects: StudioProjectRecord[];
  invalidStudioProjects: InvalidStudioProjectRecord[];
  manifestPaths: string[];
}> {
  const manifestPaths = await discoverManifestPaths(scopes);
  const studioProjects: StudioProjectRecord[] = [];
  const invalidStudioProjects: InvalidStudioProjectRecord[] = [];

  for (const manifestPath of manifestPaths) {
    const studioProjectDir = path.dirname(manifestPath);
    const relativeDir = toPosixPath(
      path.relative(STUDIO_DIR, studioProjectDir),
    );
    const segments = relativeDir.split("/");
    const scope = segments[1] ?? "";

    try {
      const manifest = await readStudioProjectManifest(manifestPath);
      studioProjects.push({
        scope,
        studioProjectDir,
        relativeDir,
        manifestPath,
        manifest,
      });
    } catch (error) {
      invalidStudioProjects.push({
        scope,
        studioProjectDir,
        relativeDir,
        manifestPath,
        error: String(error),
      });
    }
  }

  studioProjects.sort((left, right) =>
    left.relativeDir.localeCompare(right.relativeDir),
  );
  invalidStudioProjects.sort((left, right) =>
    left.relativeDir.localeCompare(right.relativeDir),
  );

  return {
    studioProjects,
    invalidStudioProjects,
    manifestPaths,
  };
}
