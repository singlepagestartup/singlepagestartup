import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve, sep } from "node:path";

import {
  STUDIO_DIR,
  discoverStudioProjects,
  normalizeStudioProjectReference,
} from "./lib/discovery";

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
  studioProjectRef: string | null;
  scope: string | null;
  type: string | null;
  port: number | null;
  host: string | null;
  help: boolean;
}

type StudioProjectRecord = Awaited<
  ReturnType<typeof discoverStudioProjects>
>["studioProjects"][number];

function printHelp(): void {
  console.log(
    `
Usage: bun tools/studio/dev.ts [<studioProject-ref>] [options]

Examples:
  bun tools/studio/dev.ts admin-panel-redesign-html
  bun tools/studio/dev.ts runnable/singlepage/admin-panel-redesign-html
  bun tools/studio/dev.ts --studioProject runnable/startup/my-next-prototype --port 4400
  STUDIO_PROJECT=admin-panel-redesign-html bun tools/studio/dev.ts

Options:
  --studioProject <id-or-path>                   Studio id or relative path from apps/studio
  --scope <singlepage|startup>           Filter studioProject by manifest.scope
  --type <html|react|next>               Filter studioProject by manifest.type
  --port <number>                        Override port (html server or child env)
  --host <hostname>                      Override host (default: 127.0.0.1 for html)
  --help                                 Show help
`.trim(),
  );
}

function parseArgs(argv: string[]): DevOptions {
  const options: DevOptions = {
    studioProjectRef: normalizeStudioProjectReference(
      process.env.STUDIO_PROJECT ?? process.env.STUDIO_PROJECT_ID ?? null,
    ),
    scope: process.env.STUDIO_SCOPE ?? null,
    type: process.env.STUDIO_TYPE ?? null,
    port: null,
    host: process.env.STUDIO_HOST ?? process.env.HOST ?? null,
    help: false,
  };
  const positional: string[] = [];

  const envPort = process.env.STUDIO_PORT ?? process.env.PORT;
  options.port = parsePort(envPort, "PORT");

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--studioProject") {
      options.studioProjectRef = normalizeStudioProjectReference(
        argv[index + 1] ?? null,
      );
      index += 1;
      continue;
    }

    if (arg.startsWith("--studioProject=")) {
      options.studioProjectRef = normalizeStudioProjectReference(
        arg.slice("--studioProject=".length),
      );
      continue;
    }

    if (arg === "--scope") {
      options.scope = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--scope=")) {
      options.scope = arg.slice("--scope=".length);
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

  if (!options.studioProjectRef && positional.length > 0) {
    options.studioProjectRef = normalizeStudioProjectReference(positional[0]);
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

function resolveStudioProject(
  studioProjects: StudioProjectRecord[],
  options: DevOptions,
): StudioProjectRecord {
  const filtered = studioProjects.filter((studioProject) => {
    if (options.scope && studioProject.manifest.scope !== options.scope) {
      return false;
    }

    if (options.type && studioProject.manifest.type !== options.type) {
      return false;
    }

    return true;
  });

  if (!options.studioProjectRef) {
    throw new Error(
      `Studio reference is required. Use --studioProject <id-or-path> or set STUDIO_PROJECT. Run "npm run studio:list" to inspect options.`,
    );
  }

  const ref = options.studioProjectRef;
  const matches = filtered.filter((studioProject) => {
    const folderName = basename(studioProject.studioProjectDir);
    const byPath =
      studioProject.relativeDir === ref ||
      studioProject.relativeDir.endsWith(`/${ref}`);
    const byId = studioProject.manifest.id === ref;
    const bySlug = folderName === ref;
    const byScopeAndId =
      `${studioProject.scope}/${studioProject.manifest.id}` === ref;

    return byPath || byId || bySlug || byScopeAndId;
  });

  if (!matches.length) {
    const inspected = filtered.map(
      (studioProject) =>
        `${studioProject.relativeDir} (${studioProject.manifest.id})`,
    );
    throw new Error(
      [
        `Studio "${ref}" was not found.`,
        `Searched in: ${STUDIO_DIR}`,
        inspected.length
          ? `Available Studio projects:\n- ${inspected.join("\n- ")}`
          : "No Studio project matched current filters.",
      ].join("\n"),
    );
  }

  if (matches.length > 1) {
    throw new Error(
      [
        `Studio reference "${ref}" is ambiguous.`,
        "Use a full relative path from apps/studio, for example:",
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

async function runStudioCommand(
  studioProject: StudioProjectRecord,
  options: DevOptions,
): Promise<void> {
  const runConfig =
    studioProject.manifest.run && typeof studioProject.manifest.run === "object"
      ? studioProject.manifest.run
      : {};
  const command = typeof runConfig.dev === "string" ? runConfig.dev.trim() : "";
  const commandToRun = command || "npm run dev";
  const commandCwd = resolve(
    studioProject.studioProjectDir,
    runConfig.cwd ?? ".",
  );
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
        `Studio "${studioProject.relativeDir}" has type "${studioProject.manifest.type}" but no executable dev command.`,
        `Add "run.dev" to ${studioProject.manifestPath} or create ${packageJsonPath}.`,
      ].join("\n"),
    );
  }

  if (hasPackageJson && !(await isDirectory(nodeModulesPath))) {
    if (!autoInstallDependencies) {
      throw new Error(
        [
          `Dependencies are not installed for studioProject "${studioProject.relativeDir}".`,
          `Auto-install is disabled (run.autoInstall=false).`,
          `Run once:`,
          `cd ${commandCwd} && ${installCommand}`,
        ].join("\n"),
      );
    }

    console.log(
      `[studio] Installing dependencies for ${studioProject.relativeDir}`,
    );
    console.log(`[studio] cwd=${commandCwd}`);
    console.log(`[studio] command=${installCommand}`);
    try {
      await runShellCommand(installCommand, commandCwd, childEnv);
    } catch (error) {
      throw new Error(
        [
          `Failed to install dependencies for studioProject "${studioProject.relativeDir}".`,
          `Install command: ${installCommand}`,
          error instanceof Error ? error.message : String(error),
        ].join("\n"),
      );
    }
  }

  console.log(`[studio] Starting ${studioProject.relativeDir}`);
  console.log(`[studio] cwd=${commandCwd}`);
  console.log(`[studio] command=${commandToRun}`);

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

function resolveInsideStudio(
  studioProjectRoot: string,
  relativePath: string,
): string | null {
  const absolutePath = resolve(studioProjectRoot, relativePath);
  if (
    absolutePath === studioProjectRoot ||
    absolutePath.startsWith(`${studioProjectRoot}${sep}`)
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

async function runHtmlStudio(
  studioProject: StudioProjectRecord,
  options: DevOptions,
): Promise<void> {
  const runConfig =
    studioProject.manifest.run && typeof studioProject.manifest.run === "object"
      ? studioProject.manifest.run
      : {};
  const port =
    options.port ?? parsePort(runConfig.port, "manifest.run.port") ?? 4310;
  const host = options.host || runConfig.host || "127.0.0.1";
  const entryPath = studioProject.manifest.entry;

  if (typeof entryPath !== "string" || !entryPath.trim()) {
    throw new Error(`Studio entry is missing in ${studioProject.manifestPath}`);
  }

  const entryAbsolute = resolveInsideStudio(
    studioProject.studioProjectDir,
    entryPath,
  );
  if (!entryAbsolute) {
    throw new Error(
      `Studio entry path "${entryPath}" points outside the studioProject folder: ${studioProject.relativeDir}`,
    );
  }

  if (!(await exists(entryAbsolute))) {
    throw new Error(`Studio entry file does not exist: ${entryAbsolute}`);
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
      // First, try path as-is from studioProject root.
      candidateRelativePaths.push(requestedPath);

      // Then fallback to entry directory so "./app.js" next to src/index.html works from "/".
      if (isEntryInSubdir) {
        candidateRelativePaths.push(join(entryDir, requestedPath));
      }
    }

    let fileResult: { path: string; content: Buffer } | null = null;
    let forbiddenHit = false;

    for (const candidateRelativePath of candidateRelativePaths) {
      const absolutePath = resolveInsideStudio(
        studioProject.studioProjectDir,
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

  console.log(`[studio] Serving ${studioProject.relativeDir}`);
  console.log(`[studio] Entry: ${entryPath}`);
  console.log(`[studio] URL: http://${host}:${port}`);

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

  const { studioProjects, invalidStudioProjects } =
    await discoverStudioProjects();

  if (invalidStudioProjects.length) {
    console.warn(
      `[studio] Invalid manifests skipped: ${invalidStudioProjects.length}`,
    );
  }

  const studioProject = resolveStudioProject(studioProjects, options);
  console.log(
    `[studio] Selected ${studioProject.relativeDir} (id=${studioProject.manifest.id}, type=${studioProject.manifest.type}, scope=${studioProject.manifest.scope})`,
  );

  if (studioProject.manifest.type === "html") {
    await runHtmlStudio(studioProject, options);
    return;
  }

  await runStudioCommand(studioProject, options);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
