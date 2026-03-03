import { readFile, stat, writeFile } from "node:fs/promises";
import * as path from "node:path";

import {
  DRAFTS_DIR,
  type DraftManifest,
  normalizeDraftReference,
} from "./lib/discovery";

const VALID_TYPES = new Set(["html", "react", "next"]);
const VALID_STATUSES = new Set(["incoming", "approved", "archived"]);

interface InitOptions {
  draftRef: string | null;
  type: "html" | "react" | "next" | null;
  status: "incoming" | "approved" | "archived" | null;
  id: string | null;
  title: string | null;
  entry: string | null;
  force: boolean;
  help: boolean;
}

interface PackageJsonLike {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function printHelp(): void {
  console.log(
    `
Usage: bun tools/drafts/init.ts <draft-path> [options]

Examples:
  bun tools/drafts/init.ts incoming/admin-v3
  bun tools/drafts/init.ts apps/drafts/incoming/ui/checkout-v1 --type react

Options:
  --draft <path>                         Draft path (relative to apps/drafts or absolute)
  --type <html|react|next>              Override detected type
  --status <incoming|approved|archived> Override status
  --id <id>                              Override manifest id
  --title <title>                        Override title
  --entry <relative-file>                Override entry file
  --force                                Overwrite existing manifest.json
  --help                                 Show help
`.trim(),
  );
}

function parseArgs(argv: string[]): InitOptions {
  const options: InitOptions = {
    draftRef: null,
    type: null,
    status: null,
    id: null,
    title: null,
    entry: null,
    force: false,
    help: false,
  };
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--draft") {
      options.draftRef = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--draft=")) {
      options.draftRef = arg.slice("--draft=".length);
      continue;
    }

    if (arg === "--type") {
      options.type = (argv[index + 1] ?? null) as InitOptions["type"];
      index += 1;
      continue;
    }

    if (arg.startsWith("--type=")) {
      options.type = arg.slice("--type=".length) as InitOptions["type"];
      continue;
    }

    if (arg === "--status") {
      options.status = (argv[index + 1] ?? null) as InitOptions["status"];
      index += 1;
      continue;
    }

    if (arg.startsWith("--status=")) {
      options.status = arg.slice("--status=".length) as InitOptions["status"];
      continue;
    }

    if (arg === "--id") {
      options.id = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--id=")) {
      options.id = arg.slice("--id=".length);
      continue;
    }

    if (arg === "--title") {
      options.title = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--title=")) {
      options.title = arg.slice("--title=".length);
      continue;
    }

    if (arg === "--entry") {
      options.entry = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--entry=")) {
      options.entry = arg.slice("--entry=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    positional.push(arg);
  }

  if (!options.draftRef && positional.length > 0) {
    options.draftRef = positional[0];
  }

  if (options.type && !VALID_TYPES.has(options.type)) {
    throw new Error(
      `--type must be one of: ${Array.from(VALID_TYPES).join(", ")}`,
    );
  }

  if (options.status && !VALID_STATUSES.has(options.status)) {
    throw new Error(
      `--status must be one of: ${Array.from(VALID_STATUSES).join(", ")}`,
    );
  }

  return options;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || "draft"
  );
}

function titleFromSlug(value: string): string {
  return value
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPathInside(basePath: string, candidatePath: string): boolean {
  const relative = path.relative(basePath, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function existsFile(absolutePath: string): Promise<boolean> {
  try {
    const info = await stat(absolutePath);
    return info.isFile();
  } catch {
    return false;
  }
}

async function existsDirectory(absolutePath: string): Promise<boolean> {
  try {
    const info = await stat(absolutePath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function readPackageJson(
  draftDir: string,
): Promise<{ path: string; pkg: PackageJsonLike } | null> {
  const packageJsonPath = path.join(draftDir, "package.json");
  if (!(await existsFile(packageJsonPath))) {
    return null;
  }

  const raw = await readFile(packageJsonPath, "utf8");
  return {
    path: packageJsonPath,
    pkg: JSON.parse(raw) as PackageJsonLike,
  };
}

function hasDependency(pkg: PackageJsonLike, dependencyName: string): boolean {
  return Boolean(
    pkg.dependencies?.[dependencyName] ||
      pkg.devDependencies?.[dependencyName] ||
      pkg.peerDependencies?.[dependencyName],
  );
}

function detectTypeFromPackageJson(
  pkg: PackageJsonLike,
): "react" | "next" | null {
  const devScript = pkg.scripts?.dev ?? "";

  if (hasDependency(pkg, "next") || /\bnext\b/.test(devScript)) {
    return "next";
  }

  if (hasDependency(pkg, "react")) {
    return "react";
  }

  return null;
}

async function inferType(
  options: InitOptions,
  draftDir: string,
  packageInfo: { path: string; pkg: PackageJsonLike } | null,
): Promise<"html" | "react" | "next"> {
  if (options.type) {
    return options.type;
  }

  if (packageInfo) {
    return detectTypeFromPackageJson(packageInfo.pkg) ?? "react";
  }

  const htmlCandidates = ["index.html", "src/index.html", "public/index.html"];
  for (const candidate of htmlCandidates) {
    if (await existsFile(path.join(draftDir, candidate))) {
      return "html";
    }
  }

  throw new Error(
    [
      `Unable to detect draft type for: ${draftDir}`,
      `Pass --type <html|react|next> explicitly.`,
    ].join("\n"),
  );
}

async function pickExistingFile(
  draftDir: string,
  candidates: string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    if (await existsFile(path.join(draftDir, candidate))) {
      return toPosixPath(candidate);
    }
  }
  return null;
}

async function inferEntry(
  options: InitOptions,
  draftDir: string,
  type: "html" | "react" | "next",
): Promise<string> {
  if (options.entry) {
    const normalized = toPosixPath(options.entry);
    const fullPath = path.resolve(draftDir, normalized);
    if (!isPathInside(draftDir, fullPath)) {
      throw new Error(
        `--entry points outside of draft folder: ${options.entry}`,
      );
    }
    if (!(await existsFile(fullPath))) {
      throw new Error(`--entry file does not exist: ${fullPath}`);
    }
    return normalized;
  }

  if (type === "html") {
    const entry =
      (await pickExistingFile(draftDir, [
        "index.html",
        "src/index.html",
        "public/index.html",
      ])) ?? null;
    if (entry) {
      return entry;
    }
  }

  if (type === "react") {
    const entry =
      (await pickExistingFile(draftDir, [
        "index.html",
        "src/index.html",
        "public/index.html",
        "package.json",
      ])) ?? null;
    if (entry) {
      return entry;
    }
  }

  if (type === "next") {
    const entry =
      (await pickExistingFile(draftDir, [
        "src/app/page.tsx",
        "app/page.tsx",
        "pages/index.tsx",
        "pages/index.js",
        "package.json",
      ])) ?? null;
    if (entry) {
      return entry;
    }
  }

  throw new Error(
    [
      `Unable to detect entry for ${type} draft: ${draftDir}`,
      `Pass --entry <relative-file> explicitly.`,
    ].join("\n"),
  );
}

function buildSchemaRef(draftDir: string): string {
  const manifestSchemaPath = path.join(DRAFTS_DIR, "manifest.schema.json");
  const relative = toPosixPath(path.relative(draftDir, manifestSchemaPath));
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function createRunConfig(
  type: "html" | "react" | "next",
): DraftManifest["run"] {
  if (type === "html") {
    return undefined;
  }

  return {
    cwd: ".",
    install: "bun install",
    autoInstall: true,
    dev: "bun run dev",
    host: "127.0.0.1",
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.draftRef) {
    throw new Error(
      `Draft path is required. Example: npm run drafts:init -- incoming/my-draft`,
    );
  }

  const normalizedDraftRef =
    normalizeDraftReference(options.draftRef) ?? options.draftRef;
  const draftDir = path.isAbsolute(options.draftRef)
    ? path.resolve(options.draftRef)
    : path.resolve(DRAFTS_DIR, normalizedDraftRef);

  if (!isPathInside(DRAFTS_DIR, draftDir)) {
    throw new Error(`Draft path must be inside ${DRAFTS_DIR}`);
  }

  if (!(await existsDirectory(draftDir))) {
    throw new Error(`Draft folder does not exist: ${draftDir}`);
  }

  const relativeDraftDir = toPosixPath(path.relative(DRAFTS_DIR, draftDir));
  const [collection = "incoming"] = relativeDraftDir.split("/");
  const inferredStatus = VALID_STATUSES.has(collection)
    ? (collection as "incoming" | "approved" | "archived")
    : "incoming";

  const status = options.status ?? inferredStatus;
  const packageInfo = await readPackageJson(draftDir);
  const type = await inferType(options, draftDir, packageInfo);
  const entry = await inferEntry(options, draftDir, type);
  const folderName = path.basename(draftDir);
  const id = options.id ? slugify(options.id) : slugify(folderName);
  const title = options.title?.trim() || titleFromSlug(id);
  const manifestPath = path.join(draftDir, "manifest.json");
  const manifestExists = await existsFile(manifestPath);

  if (manifestExists && !options.force) {
    throw new Error(
      [
        `manifest.json already exists: ${manifestPath}`,
        `Use --force to overwrite.`,
      ].join("\n"),
    );
  }

  const now = new Date().toISOString();
  const manifest: DraftManifest = {
    $schema: buildSchemaRef(draftDir),
    id,
    title,
    type,
    entry,
    status,
    createdAt: now,
    updatedAt: now,
  };

  const runConfig = createRunConfig(type);
  if (runConfig) {
    manifest.run = runConfig;
  }

  await writeFile(
    `${manifestPath}`,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log(`[drafts] Generated manifest: ${manifestPath}`);
  console.log(`[drafts] id=${manifest.id}`);
  console.log(`[drafts] type=${manifest.type}`);
  console.log(`[drafts] status=${manifest.status}`);
  console.log(`[drafts] entry=${manifest.entry}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
