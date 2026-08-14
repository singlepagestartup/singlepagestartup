import { readFile, stat, writeFile } from "node:fs/promises";
import * as path from "node:path";

import {
  STUDIO_DIR,
  type StudioProjectManifest,
  normalizeStudioProjectReference,
} from "./lib/discovery";

const VALID_TYPES = new Set(["html", "react", "next"]);
const VALID_SCOPES = new Set(["singlepage", "startup"]);

interface InitOptions {
  studioProjectRef: string | null;
  type: "html" | "react" | "next" | null;
  scope: "singlepage" | "startup" | null;
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
Usage: bun tools/studio/init.ts <studioProject-path> [options]

Examples:
  bun tools/studio/init.ts runnable/singlepage/admin-v3
  bun tools/studio/init.ts apps/studio/runnable/startup/checkout-v1 --type react

Options:
  --studioProject <path>                         Studio path (relative to apps/studio or absolute)
  --type <html|react|next>              Override detected type
  --scope <singlepage|startup>          Override scope
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
    studioProjectRef: null,
    type: null,
    scope: null,
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

    if (arg === "--studioProject") {
      options.studioProjectRef = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--studioProject=")) {
      options.studioProjectRef = arg.slice("--studioProject=".length);
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

    if (arg === "--scope") {
      options.scope = (argv[index + 1] ?? null) as InitOptions["scope"];
      index += 1;
      continue;
    }

    if (arg.startsWith("--scope=")) {
      options.scope = arg.slice("--scope=".length) as InitOptions["scope"];
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

  if (!options.studioProjectRef && positional.length > 0) {
    options.studioProjectRef = positional[0];
  }

  if (options.type && !VALID_TYPES.has(options.type)) {
    throw new Error(
      `--type must be one of: ${Array.from(VALID_TYPES).join(", ")}`,
    );
  }

  if (options.scope && !VALID_SCOPES.has(options.scope)) {
    throw new Error(
      `--scope must be one of: ${Array.from(VALID_SCOPES).join(", ")}`,
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
      .replace(/-+$/, "") || "studioProject"
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
  studioProjectDir: string,
): Promise<{ path: string; pkg: PackageJsonLike } | null> {
  const packageJsonPath = path.join(studioProjectDir, "package.json");
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
  studioProjectDir: string,
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
    if (await existsFile(path.join(studioProjectDir, candidate))) {
      return "html";
    }
  }

  throw new Error(
    [
      `Unable to detect studioProject type for: ${studioProjectDir}`,
      `Pass --type <html|react|next> explicitly.`,
    ].join("\n"),
  );
}

async function pickExistingFile(
  studioProjectDir: string,
  candidates: string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    if (await existsFile(path.join(studioProjectDir, candidate))) {
      return toPosixPath(candidate);
    }
  }
  return null;
}

async function inferEntry(
  options: InitOptions,
  studioProjectDir: string,
  type: "html" | "react" | "next",
): Promise<string> {
  if (options.entry) {
    const normalized = toPosixPath(options.entry);
    const fullPath = path.resolve(studioProjectDir, normalized);
    if (!isPathInside(studioProjectDir, fullPath)) {
      throw new Error(
        `--entry points outside of studioProject folder: ${options.entry}`,
      );
    }
    if (!(await existsFile(fullPath))) {
      throw new Error(`--entry file does not exist: ${fullPath}`);
    }
    return normalized;
  }

  if (type === "html") {
    const entry =
      (await pickExistingFile(studioProjectDir, [
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
      (await pickExistingFile(studioProjectDir, [
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
      (await pickExistingFile(studioProjectDir, [
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
      `Unable to detect entry for ${type} studioProject: ${studioProjectDir}`,
      `Pass --entry <relative-file> explicitly.`,
    ].join("\n"),
  );
}

function buildSchemaRef(studioProjectDir: string): string {
  const manifestSchemaPath = path.join(STUDIO_DIR, "manifest.schema.json");
  const relative = toPosixPath(
    path.relative(studioProjectDir, manifestSchemaPath),
  );
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function createRunConfig(
  type: "html" | "react" | "next",
): StudioProjectManifest["run"] {
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

  if (!options.studioProjectRef) {
    throw new Error(
      `Studio path is required. Example: npm run studio:init -- runnable/startup/my-studioProject`,
    );
  }

  const normalizedStudioRef =
    normalizeStudioProjectReference(options.studioProjectRef) ??
    options.studioProjectRef;
  const studioProjectDir = path.isAbsolute(options.studioProjectRef)
    ? path.resolve(options.studioProjectRef)
    : path.resolve(STUDIO_DIR, normalizedStudioRef);

  if (!isPathInside(STUDIO_DIR, studioProjectDir)) {
    throw new Error(`Studio path must be inside ${STUDIO_DIR}`);
  }

  if (!(await existsDirectory(studioProjectDir))) {
    throw new Error(`Studio folder does not exist: ${studioProjectDir}`);
  }

  const relativeStudioDir = toPosixPath(
    path.relative(STUDIO_DIR, studioProjectDir),
  );
  const pathSegments = relativeStudioDir.split("/");

  if (pathSegments[0] !== "runnable") {
    throw new Error(`Runnable studioProject path must start with runnable/.`);
  }

  const scopeSegment = pathSegments[1] ?? "";
  if (!VALID_SCOPES.has(scopeSegment) && !options.scope) {
    throw new Error(
      `Pass --scope <singlepage|startup> or place the studioProject under runnable/singlepage or runnable/startup.`,
    );
  }

  const inferredScope = VALID_SCOPES.has(scopeSegment)
    ? (scopeSegment as "singlepage" | "startup")
    : options.scope;
  const scope = options.scope ?? inferredScope;
  if (!scope) {
    throw new Error(`Unable to infer studioProject scope.`);
  }

  if (VALID_SCOPES.has(scopeSegment) && scope !== inferredScope) {
    throw new Error(
      `--scope (${scope}) must match studioProject folder scope (${inferredScope})`,
    );
  }
  const packageInfo = await readPackageJson(studioProjectDir);
  const type = await inferType(options, studioProjectDir, packageInfo);
  const entry = await inferEntry(options, studioProjectDir, type);
  const folderName = path.basename(studioProjectDir);
  const id = options.id ? slugify(options.id) : slugify(folderName);
  const title = options.title?.trim() || titleFromSlug(id);
  const manifestPath = path.join(studioProjectDir, "manifest.json");
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
  const manifest: StudioProjectManifest = {
    $schema: buildSchemaRef(studioProjectDir),
    id,
    title,
    type,
    entry,
    scope,
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

  console.log(`[studio] Generated manifest: ${manifestPath}`);
  console.log(`[studio] id=${manifest.id}`);
  console.log(`[studio] type=${manifest.type}`);
  console.log(`[studio] scope=${manifest.scope}`);
  console.log(`[studio] entry=${manifest.entry}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
