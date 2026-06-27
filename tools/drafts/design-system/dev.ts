import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import * as path from "node:path";

const ROOT = process.cwd();
const DESIGN_SYSTEM_ROOT = path.join(ROOT, "apps", "drafts");
const DEFAULT_REF = "modules/host/models/page/singlepage/landing-page-basic";
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
  ".webp": "image/webp",
};

interface DevOptions {
  ref: string;
  host: string;
  port: number;
  help: boolean;
}

function printHelp(): void {
  console.log(
    `
Usage: bun tools/drafts/design-system/dev.ts [blocks-or-pages-ref] [options]

Examples:
  bun tools/drafts/design-system/dev.ts
  bun tools/drafts/design-system/dev.ts modules/host/models/page/singlepage/landing-page-basic
  bun tools/drafts/design-system/dev.ts modules/website-builder/models/widget/singlepage/hero-default

Options:
  --host <hostname>  Hostname, default 127.0.0.1
  --port <number>    Port, default 4320
  --help             Show help
`.trim(),
  );
}

function parsePort(value: unknown, fieldName: string): number {
  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${fieldName} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

function parseArgs(argv: string[]): DevOptions {
  const options: DevOptions = {
    ref: process.env.DRAFTS_DS_REF || DEFAULT_REF,
    host: process.env.DRAFTS_DS_HOST || "127.0.0.1",
    port: parsePort(process.env.DRAFTS_DS_PORT || "4320", "DRAFTS_DS_PORT"),
    help: false,
  };
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--host") {
      options.host = argv[index + 1] || options.host;
      index += 1;
      continue;
    }

    if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length);
      continue;
    }

    if (arg === "--port") {
      options.port = parsePort(argv[index + 1], "--port");
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = parsePort(arg.slice("--port=".length), "--port");
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional[0]) {
    options.ref = positional[0];
  }

  options.ref = options.ref
    .replace(/^apps\/drafts\/design-system\//, "")
    .replace(/^apps\/drafts\/singlepage\/design-system\//, "")
    .replace(/^apps\/drafts\/singlepage\//, "")
    .replace(/^apps\/drafts\//, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return options;
}

function resolveInsideDesignSystem(relativePath: string): string | null {
  const absolutePath = path.resolve(DESIGN_SYSTEM_ROOT, relativePath);
  if (
    absolutePath === DESIGN_SYSTEM_ROOT ||
    absolutePath.startsWith(`${DESIGN_SYSTEM_ROOT}${path.sep}`)
  ) {
    return absolutePath;
  }

  return null;
}

async function readStaticFile(
  absolutePath: string,
): Promise<{ filePath: string; content: Buffer } | null> {
  try {
    const info = await stat(absolutePath);
    if (info.isDirectory()) {
      const indexPath = path.join(absolutePath, "index.html");
      const indexInfo = await stat(indexPath);
      if (!indexInfo.isFile()) {
        return null;
      }

      return {
        filePath: indexPath,
        content: await readFile(indexPath),
      };
    }

    if (!info.isFile()) {
      return null;
    }

    return {
      filePath: absolutePath,
      content: await readFile(absolutePath),
    };
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const defaultAbsolute = resolveInsideDesignSystem(options.ref);
  if (!defaultAbsolute || !(await readStaticFile(defaultAbsolute))) {
    throw new Error(
      `Draft-system ref was not found: apps/drafts/${options.ref}`,
    );
  }

  const server = createServer(async (request, response) => {
    const url = new URL(
      request.url ?? "/",
      `http://${options.host}:${options.port}`,
    );
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath =
      pathname === "/" ? options.ref : pathname.replace(/^\/+/, "");
    const absolutePath = resolveInsideDesignSystem(requestedPath);

    if (!absolutePath) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    const result = await readStaticFile(absolutePath);
    if (!result) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(result.filePath).toLowerCase();
    response.writeHead(200, {
      "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
    });
    response.end(result.content);
  });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(options.port, options.host, resolvePromise);
  });

  console.log(`[drafts:ds] Serving apps/drafts/${options.ref}`);
  console.log(`[drafts:ds] URL: http://${options.host}:${options.port}`);

  const closeServer = (): void => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
