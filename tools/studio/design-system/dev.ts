import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const ROOT = process.cwd();
const DESIGN_SYSTEM_ROOT = path.join(ROOT, "apps", "studio");
const DEFAULT_REF = "modules/website-builder/widget/singlepage/content-default";
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
Usage: bun tools/studio/design-system/dev.ts [blocks-or-pages-ref] [options]

Examples:
  bun tools/studio/design-system/dev.ts
  bun tools/studio/design-system/dev.ts modules/website-builder/widget/singlepage/content-default

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
    ref: process.env.STUDIO_DESIGN_SYSTEM_REF || DEFAULT_REF,
    host: process.env.STUDIO_DESIGN_SYSTEM_HOST || "127.0.0.1",
    port: parsePort(
      process.env.STUDIO_DESIGN_SYSTEM_PORT || "4320",
      "STUDIO_DESIGN_SYSTEM_PORT",
    ),
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
    .replace(/^apps\/studio\/design-system\//, "")
    .replace(/^apps\/studio\/singlepage\/design-system\//, "")
    .replace(/^apps\/studio\/singlepage\//, "")
    .replace(/^apps\/studio\//, "")
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

export async function createDesignSystemServer(ref = DEFAULT_REF) {
  const defaultAbsolute = resolveInsideDesignSystem(ref);
  if (!defaultAbsolute || !(await readStaticFile(defaultAbsolute))) {
    throw new Error(`Studio-system ref was not found: apps/studio/${ref}`);
  }

  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname === "/" ? ref : pathname.replace(/^\/+/, "");
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

    // A canonical file URL keeps relative styles, scripts and images anchored
    // to the preview folder when opened from / or a directory URL.
    if (pathname === "/" || result.filePath !== absolutePath) {
      const location = path
        .relative(DESIGN_SYSTEM_ROOT, result.filePath)
        .split(path.sep)
        .map(encodeURIComponent)
        .join("/");
      response.writeHead(307, { location: `/${location}${url.search}` });
      response.end();
      return;
    }

    const extension = path.extname(result.filePath).toLowerCase();
    let content = result.content;
    if (
      result.filePath === path.join(DESIGN_SYSTEM_ROOT, "runtime/styles.css")
    ) {
      try {
        const styles = await postcss([tailwindcss()]).process(
          content.toString("utf8"),
          { from: result.filePath },
        );
        content = Buffer.from(styles.css);
      } catch (error) {
        response.writeHead(500, {
          "content-type": "text/plain; charset=utf-8",
        });
        response.end(String(error));
        return;
      }
    }
    response.writeHead(200, {
      "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
    });
    response.end(content);
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const server = await createDesignSystemServer(options.ref);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(options.port, options.host, resolvePromise);
  });

  console.log(`[studio:design-system] Serving apps/studio/${options.ref}`);
  console.log(
    `[studio:design-system] URL: http://${options.host}:${options.port}`,
  );

  const closeServer = (): void => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}

if (import.meta.main)
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
