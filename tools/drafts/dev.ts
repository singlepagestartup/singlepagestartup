import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve, sep } from "node:path";

import {
  DRAFTS_DIR,
  discoverDrafts,
  normalizeDraftReference,
} from "./lib/discovery";

const COLLECTION_STATUSES = new Set(["incoming", "approved", "archived"]);
const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
};

interface DevOptions {
  draftRef: string | null;
  status: string | null;
  type: string | null;
  port: number | null;
  host: string | null;
  help: boolean;
}

type DraftRecord = Awaited<ReturnType<typeof discoverDrafts>>["drafts"][number];

function printHelp(): void {
  console.log(
    `
Usage: bun tools/drafts/dev.ts [<draft-ref>] [options]

Examples:
  bun tools/drafts/dev.ts admin-panel-redesign-html
  bun tools/drafts/dev.ts incoming/ui/admin-panel-redesign-html
  bun tools/drafts/dev.ts --draft incoming/ui/my-next-prototype --port 4400
  DRAFT=admin-panel-redesign-html bun tools/drafts/dev.ts

Options:
  --draft <id-or-path>                   Draft id or relative path from apps/drafts
  --status <incoming|approved|archived>  Filter draft by manifest.status
  --type <html|react|next>               Filter draft by manifest.type
  --port <number>                        Override port (html server or child env)
  --host <hostname>                      Override host (default: 127.0.0.1 for html)
  --help                                 Show help
`.trim(),
  );
}

function parseArgs(argv: string[]): DevOptions {
  const options: DevOptions = {
    draftRef: normalizeDraftReference(
      process.env.DRAFT ?? process.env.DRAFT_ID ?? null,
    ),
    status: process.env.DRAFT_STATUS ?? null,
    type: process.env.DRAFT_TYPE ?? null,
    port: null,
    host: process.env.DRAFT_HOST ?? process.env.HOST ?? null,
    help: false,
  };
  const positional: string[] = [];

  const envPort = process.env.DRAFT_PORT ?? process.env.PORT;
  options.port = parsePort(envPort, "PORT");

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--draft") {
      options.draftRef = normalizeDraftReference(argv[index + 1] ?? null);
      index += 1;
      continue;
    }

    if (arg.startsWith("--draft=")) {
      options.draftRef = normalizeDraftReference(arg.slice("--draft=".length));
      continue;
    }

    if (arg === "--status") {
      options.status = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--status=")) {
      options.status = arg.slice("--status=".length);
      continue;
    }

    if (arg === "--type") {
      options.type = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--type=")) {
      options.type = arg.slice("--type=".length);
      continue;
    }

    if (arg === "--port") {
      options.port = parsePort(argv[index + 1] ?? null, "--port");
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = parsePort(arg.slice("--port=".length), "--port");
      continue;
    }

    if (arg === "--host") {
      options.host = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    positional.push(arg);
  }

  if (!options.draftRef && positional.length > 0) {
    options.draftRef = normalizeDraftReference(positional[0]);
  }

  return options;
}

function parsePort(value: unknown, fieldName: string): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${fieldName} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

function resolveDraft(drafts: DraftRecord[], options: DevOptions): DraftRecord {
  const filtered = drafts.filter((draft) => {
    if (options.status && draft.manifest.status !== options.status) {
      return false;
    }

    if (options.type && draft.manifest.type !== options.type) {
      return false;
    }

    return true;
  });

  if (!options.draftRef) {
    throw new Error(
      `Draft reference is required. Use --draft <id-or-path> or set DRAFT. Run "npm run drafts:list" to inspect options.`,
    );
  }

  const ref = options.draftRef;
  const matches = filtered.filter((draft) => {
    const folderName = basename(draft.draftDir);
    const byPath =
      draft.relativeDir === ref || draft.relativeDir.endsWith(`/${ref}`);
    const byId = draft.manifest.id === ref;
    const bySlug = folderName === ref;
    const byCollectionAndId =
      `${draft.collection}/${draft.manifest.id}` === ref;

    return byPath || byId || bySlug || byCollectionAndId;
  });

  if (!matches.length) {
    const inspected = filtered.map(
      (draft) => `${draft.relativeDir} (${draft.manifest.id})`,
    );
    throw new Error(
      [
        `Draft "${ref}" was not found.`,
        `Searched in: ${DRAFTS_DIR}`,
        inspected.length
          ? `Available drafts:\n- ${inspected.join("\n- ")}`
          : "No drafts matched current filters.",
      ].join("\n"),
    );
  }

  if (matches.length > 1) {
    throw new Error(
      [
        `Draft reference "${ref}" is ambiguous.`,
        "Use a full relative path from apps/drafts, for example:",
        ...matches.map((match) => `- ${match.relativeDir}`),
      ].join("\n"),
    );
  }

  return matches[0];
}

function createChildEnv(options: DevOptions): NodeJS.ProcessEnv {
  const env = { ...process.env };

  if (options.port != null) {
    env.PORT = String(options.port);
  }

  if (options.host) {
    env.HOST = options.host;
  }

  return env;
}

async function exists(pathToCheck: string): Promise<boolean> {
  try {
    await access(pathToCheck);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(pathToCheck: string): Promise<boolean> {
  try {
    const info = await stat(pathToCheck);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function runShellCommand(
  command: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, {
      cwd,
      env,
      stdio: "inherit",
      shell: true,
    });

    const forwardSignal = (signal: NodeJS.Signals): void => {
      if (!child.killed) {
        child.kill(signal);
      }
    };

    process.on("SIGINT", forwardSignal);
    process.on("SIGTERM", forwardSignal);

    child.on("error", (error) => {
      process.off("SIGINT", forwardSignal);
      process.off("SIGTERM", forwardSignal);
      rejectPromise(error);
    });

    child.on("close", (code) => {
      process.off("SIGINT", forwardSignal);
      process.off("SIGTERM", forwardSignal);

      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(
        new Error(`Command failed with exit code ${code ?? "unknown"}`),
      );
    });
  });
}

async function runDraftCommand(
  draft: DraftRecord,
  options: DevOptions,
): Promise<void> {
  const runConfig =
    draft.manifest.run && typeof draft.manifest.run === "object"
      ? draft.manifest.run
      : {};
  const command = typeof runConfig.dev === "string" ? runConfig.dev.trim() : "";
  const commandToRun = command || "npm run dev";
  const commandCwd = resolve(draft.draftDir, runConfig.cwd ?? ".");
  const packageJsonPath = resolve(commandCwd, "package.json");
  const nodeModulesPath = resolve(commandCwd, "node_modules");
  const installCommand =
    typeof runConfig.install === "string" && runConfig.install.trim()
      ? runConfig.install.trim()
      : "bun install";
  const autoInstallDependencies = runConfig.autoInstall !== false;
  const childEnv = createChildEnv(options);

  const hasPackageJson = await exists(packageJsonPath);
  if (!command && !hasPackageJson) {
    throw new Error(
      [
        `Draft "${draft.relativeDir}" has type "${draft.manifest.type}" but no executable dev command.`,
        `Add "run.dev" to ${draft.manifestPath} or create ${packageJsonPath}.`,
      ].join("\n"),
    );
  }

  if (hasPackageJson && !(await isDirectory(nodeModulesPath))) {
    if (!autoInstallDependencies) {
      throw new Error(
        [
          `Dependencies are not installed for draft "${draft.relativeDir}".`,
          `Auto-install is disabled (run.autoInstall=false).`,
          `Run once:`,
          `cd ${commandCwd} && ${installCommand}`,
        ].join("\n"),
      );
    }

    console.log(`[drafts] Installing dependencies for ${draft.relativeDir}`);
    console.log(`[drafts] cwd=${commandCwd}`);
    console.log(`[drafts] command=${installCommand}`);
    try {
      await runShellCommand(installCommand, commandCwd, childEnv);
    } catch (error) {
      throw new Error(
        [
          `Failed to install dependencies for draft "${draft.relativeDir}".`,
          `Install command: ${installCommand}`,
          error instanceof Error ? error.message : String(error),
        ].join("\n"),
      );
    }
  }

  console.log(`[drafts] Starting ${draft.relativeDir}`);
  console.log(`[drafts] cwd=${commandCwd}`);
  console.log(`[drafts] command=${commandToRun}`);

  const child = spawn(commandToRun, {
    cwd: commandCwd,
    env: childEnv,
    stdio: "inherit",
    shell: true,
  });

  const forwardSignal = (signal: NodeJS.Signals): void => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

function resolveInsideDraft(
  draftRoot: string,
  relativePath: string,
): string | null {
  const absolutePath = resolve(draftRoot, relativePath);
  if (
    absolutePath === draftRoot ||
    absolutePath.startsWith(`${draftRoot}${sep}`)
  ) {
    return absolutePath;
  }
  return null;
}

async function readStaticFile(
  filePath: string,
): Promise<{ path: string; content: Buffer } | null> {
  try {
    const fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      const indexPath = resolve(filePath, "index.html");
      const indexInfo = await stat(indexPath);
      if (!indexInfo.isFile()) {
        return null;
      }
      return {
        path: indexPath,
        content: await readFile(indexPath),
      };
    }

    if (!fileInfo.isFile()) {
      return null;
    }

    return {
      path: filePath,
      content: await readFile(filePath),
    };
  } catch {
    return null;
  }
}

async function runHtmlDraft(
  draft: DraftRecord,
  options: DevOptions,
): Promise<void> {
  const runConfig =
    draft.manifest.run && typeof draft.manifest.run === "object"
      ? draft.manifest.run
      : {};
  const port =
    options.port ?? parsePort(runConfig.port, "manifest.run.port") ?? 4310;
  const host = options.host || runConfig.host || "127.0.0.1";
  const entryPath = draft.manifest.entry;

  if (typeof entryPath !== "string" || !entryPath.trim()) {
    throw new Error(`Draft entry is missing in ${draft.manifestPath}`);
  }

  const entryAbsolute = resolveInsideDraft(draft.draftDir, entryPath);
  if (!entryAbsolute) {
    throw new Error(
      `Draft entry path "${entryPath}" points outside the draft folder: ${draft.relativeDir}`,
    );
  }

  if (!(await exists(entryAbsolute))) {
    throw new Error(`Draft entry file does not exist: ${entryAbsolute}`);
  }

  const entryDir = dirname(entryPath);
  const isEntryInSubdir = entryDir !== ".";

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname.replace(/^\/+/, "");

    const candidateRelativePaths: string[] = [];
    if (pathname === "/") {
      candidateRelativePaths.push(entryPath);
    } else {
      // First, try path as-is from draft root.
      candidateRelativePaths.push(requestedPath);

      // Then fallback to entry directory so "./app.js" next to src/index.html works from "/".
      if (isEntryInSubdir) {
        candidateRelativePaths.push(join(entryDir, requestedPath));
      }
    }

    let fileResult: { path: string; content: Buffer } | null = null;
    let forbiddenHit = false;

    for (const candidateRelativePath of candidateRelativePaths) {
      const absolutePath = resolveInsideDraft(
        draft.draftDir,
        candidateRelativePath,
      );
      if (!absolutePath) {
        forbiddenHit = true;
        continue;
      }

      fileResult = await readStaticFile(absolutePath);
      if (fileResult) {
        break;
      }
    }

    if (!fileResult && forbiddenHit) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    if (!fileResult) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = extname(fileResult.path).toLowerCase();
    const contentType = MIME_TYPES[extension] ?? "application/octet-stream";
    response.writeHead(200, { "content-type": contentType });
    response.end(fileResult.content);
  });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, host, resolvePromise);
  });

  console.log(`[drafts] Serving ${draft.relativeDir}`);
  console.log(`[drafts] Entry: ${entryPath}`);
  console.log(`[drafts] URL: http://${host}:${port}`);

  const closeServer = (): void => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const { drafts, invalidDrafts } = await discoverDrafts();

  if (invalidDrafts.length) {
    console.warn(`[drafts] Invalid manifests skipped: ${invalidDrafts.length}`);
  }

  const draft = resolveDraft(drafts, options);
  console.log(
    `[drafts] Selected ${draft.relativeDir} (id=${draft.manifest.id}, type=${draft.manifest.type}, status=${draft.manifest.status})`,
  );

  if (
    COLLECTION_STATUSES.has(draft.collection) &&
    draft.manifest.status &&
    draft.collection !== draft.manifest.status
  ) {
    console.warn(
      `[drafts] Warning: folder collection "${draft.collection}" and manifest.status "${draft.manifest.status}" differ.`,
    );
  }

  if (draft.manifest.type === "html") {
    await runHtmlDraft(draft, options);
    return;
  }

  await runDraftCommand(draft, options);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
