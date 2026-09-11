import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolvePresentationOutputTarget } from "./output";

const STORY_ID = "workspace-40-products--default";
const WIDTH = 1600;
const HEIGHT = 900;

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function chromePath(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter((candidate): candidate is string => Boolean(candidate));
  const selected = candidates.find(existsSync);
  if (!selected) {
    throw new Error(
      "Chrome or Chromium was not found. Set CHROME_PATH to a browser executable.",
    );
  }
  return selected;
}

function run(command: string[], repositoryRoot: string) {
  const result = Bun.spawnSync(command, {
    cwd: repositoryRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed (${result.exitCode}): ${command.join(" ")}`,
    );
  }
}

interface ICdpMessage {
  error?: { message: string };
  id?: number;
  method?: string;
  result?: unknown;
}

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    {
      reject: (reason: Error) => void;
      resolve: (value: unknown) => void;
    }
  >();

  constructor(private readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as ICdpMessage;
      if (message.id == null) return;
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) {
        request.reject(new Error(message.error.message));
      } else {
        request.resolve(message.result);
      }
    });
  }

  close() {
    this.socket.close();
  }

  send<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        reject,
        resolve: (value) => resolve(value as T),
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function launchChrome(repositoryRoot: string) {
  const profileRoot = mkdtempSync(
    path.join(os.tmpdir(), "singlepagestartup-presentation-chrome-"),
  );
  const browserProcess = Bun.spawn(
    [
      chromePath(),
      "--headless=new",
      "--disable-background-networking",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-proxy-server",
      "--remote-allow-origins=*",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileRoot}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      "about:blank",
    ],
    { cwd: repositoryRoot, stderr: "ignore", stdout: "ignore" },
  );

  const portFile = path.join(profileRoot, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !existsSync(portFile); attempt += 1) {
    await Bun.sleep(50);
  }
  if (!existsSync(portFile)) {
    browserProcess.kill();
    throw new Error("Chrome did not expose its DevTools port.");
  }
  const port = readFileSync(portFile, "utf8").split("\n")[0];
  const targets = (await fetch(`http://127.0.0.1:${port}/json/list`).then(
    (response) => response.json(),
  )) as Array<{ type: string; webSocketDebuggerUrl?: string }>;
  const webSocketUrl = targets.find(
    (target) => target.type === "page",
  )?.webSocketDebuggerUrl;
  if (!webSocketUrl) {
    browserProcess.kill();
    throw new Error("Chrome did not expose a page target.");
  }

  const socket = new WebSocket(webSocketUrl);
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("Chrome DevTools WebSocket failed to open.")),
      { once: true },
    );
  });
  return {
    browserProcess,
    client: new CdpClient(socket),
    profileRoot,
  };
}

async function navigateToPresentation(options: {
  client: CdpClient;
  expectedSlideCount?: number;
  url: string;
}) {
  await options.client.send("Page.navigate", { url: options.url });
  const expression = `(async () => {
    await document.fonts.ready;
    const count = ${options.expectedSlideCount ?? 'Number(document.querySelector("[data-presentation-ready]")?.getAttribute("data-slide-count"))'};
    return count > 0 && document.querySelectorAll('[data-slide-id]').length === count;
  })()`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const evaluated = await options.client.send<{
        result?: { value?: boolean };
      }>("Runtime.evaluate", {
        awaitPromise: true,
        expression,
        returnByValue: true,
      });
      if (evaluated.result?.value) return;
    } catch {
      // The execution context is briefly unavailable while Storybook navigates.
    }
    await Bun.sleep(100);
  }
  throw new Error(`Presentation did not become ready: ${options.url}`);
}

async function assertPresentationLayout(client: CdpClient) {
  const evaluated = await client.send<{
    result?: { value?: string };
  }>("Runtime.evaluate", {
    expression: `JSON.stringify([...document.querySelectorAll('[data-slide-id]')]
      .map((slide) => {
        const content = slide.querySelector('[data-slide-content]');
        const footer = slide.querySelector('[data-slide-footer]');
        const body = content?.firstElementChild;
        if (!content || !footer || !body) return null;
        const bodyBottom = body.getBoundingClientRect().bottom;
        const footerTop = footer.getBoundingClientRect().top;
        return bodyBottom > footerTop - 8
          ? { id: slide.getAttribute('data-slide-id'), overlap: Math.ceil(bodyBottom - footerTop) }
          : null;
      })
      .filter(Boolean))`,
    returnByValue: true,
  });
  const failures = JSON.parse(evaluated.result?.value ?? "[]") as Array<{
    id: string;
    overlap: number;
  }>;
  if (failures.length > 0) {
    throw new Error(
      `Presentation content overlaps its footer: ${failures
        .map((failure) => `${failure.id} (${failure.overlap}px)`)
        .join(", ")}`,
    );
  }
}

function staticHtml(dom: string): string {
  return dom
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "")
    .replace(
      /\b(href|src)="https?:\/\/(?:127\.0\.0\.1|localhost):\d+\//g,
      '$1="/',
    )
    .replace(/\b(href|src)="(?:\/|\.\/)/g, '$1="./presentation-assets/')
    .replace(
      /url\((["']?)\.\/sb-common-assets\//g,
      "url($1./presentation-assets/sb-common-assets/",
    )
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      "<title>SinglePageStartup presentation</title>",
    );
}

function startStaticServer(buildRoot: string) {
  const serve = (port: number) =>
    Bun.serve({
      port,
      async fetch(request) {
        const pathname = decodeURIComponent(new URL(request.url).pathname);
        const relativePath =
          pathname === "/" ? "index.html" : pathname.slice(1);
        const filePath = path.resolve(buildRoot, relativePath);
        if (!filePath.startsWith(`${path.resolve(buildRoot)}${path.sep}`)) {
          return new Response("Not found", { status: 404 });
        }
        const file = Bun.file(filePath);
        return (await file.exists())
          ? new Response(file)
          : new Response("Not found", { status: 404 });
      },
    });

  for (let port = 4380; port < 4400; port += 1) {
    try {
      return serve(port);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("port")) {
        throw error;
      }
    }
  }
  throw new Error("No free local port was found for Studio export.");
}

async function main() {
  const repositoryRoot = process.cwd();
  const assertedLayer = option("--layer");
  if (
    assertedLayer != null &&
    assertedLayer !== "singlepage" &&
    assertedLayer !== "startup"
  ) {
    throw new Error("--layer must be singlepage or startup when provided.");
  }
  const target = resolvePresentationOutputTarget({
    assertedLayer,
    presentationId: option("--id"),
    repositoryRoot,
  });
  const buildRoot = path.join(repositoryRoot, "dist/studio/storybook");
  if (!process.argv.includes("--skip-build")) {
    run(["npm", "run", "studio:storybook:build"], repositoryRoot);
  }
  if (!existsSync(path.join(buildRoot, "iframe.html"))) {
    throw new Error(
      "The Studio Storybook build is missing. Run without --skip-build first.",
    );
  }

  mkdirSync(target.outputDirectory, { recursive: true });
  rmSync(target.pngDirectory, { recursive: true, force: true });
  mkdirSync(target.pngDirectory, { recursive: true });
  const presentationAssets = path.join(
    target.outputDirectory,
    "presentation-assets",
  );
  rmSync(presentationAssets, { recursive: true, force: true });
  cpSync(buildRoot, presentationAssets, { recursive: true });

  let slides: Array<{ id: string }> = [];
  const server = startStaticServer(buildRoot);
  const chrome = await launchChrome(repositoryRoot);
  try {
    const baseUrl = `http://127.0.0.1:${server.port}/iframe.html?id=${STORY_ID}&viewMode=story&document=presentation&product=${encodeURIComponent(target.presentationId)}`;
    await chrome.client.send("Page.enable");
    await chrome.client.send("Runtime.enable");
    await chrome.client.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: HEIGHT,
      mobile: false,
      width: WIDTH,
    });
    await navigateToPresentation({
      client: chrome.client,
      url: `${baseUrl}&export=html`,
    });
    const renderedSlides = await chrome.client.send<{
      result: { value: Array<{ id: string }> };
    }>("Runtime.evaluate", {
      expression:
        "Array.from(document.querySelectorAll('[data-slide-id]'), element => ({id: element.getAttribute('data-slide-id')}))",
      returnByValue: true,
    });
    slides = renderedSlides.result.value;
    if (
      !slides.length ||
      slides.some((slide) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slide.id)) ||
      new Set(slides.map((slide) => slide.id)).size !== slides.length
    ) {
      throw new Error(
        "Presentation slide IDs must be unique, non-empty kebab-case identifiers.",
      );
    }
    await assertPresentationLayout(chrome.client);
    const evaluated = await chrome.client.send<{
      result: { value: string };
    }>("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });
    writeFileSync(target.htmlPath, staticHtml(evaluated.result.value));

    const pdf = await chrome.client.send<{ data: string }>("Page.printToPDF", {
      displayHeaderFooter: false,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      paperHeight: HEIGHT / 96,
      paperWidth: WIDTH / 96,
      preferCSSPageSize: true,
      printBackground: true,
    });
    writeFileSync(target.pdfPath, Buffer.from(pdf.data, "base64"));

    for (const [index, slide] of slides.entries()) {
      const number = String(index + 1).padStart(2, "0");
      await navigateToPresentation({
        client: chrome.client,
        expectedSlideCount: 1,
        url: `${baseUrl}&export=png&slide=${index}`,
      });
      const png = await chrome.client.send<{ data: string }>(
        "Page.captureScreenshot",
        {
          captureBeyondViewport: false,
          format: "png",
          fromSurface: true,
        },
      );
      writeFileSync(
        path.join(target.pngDirectory, `${number}-${slide.id}.png`),
        Buffer.from(png.data, "base64"),
      );
    }
  } finally {
    chrome.client.close();
    chrome.browserProcess.kill();
    rmSync(chrome.profileRoot, { recursive: true, force: true });
    server.stop(true);
  }

  writeFileSync(
    target.manifestPath,
    `${JSON.stringify(
      {
        formats: {
          html: path.relative(target.outputDirectory, target.htmlPath),
          pdf: path.relative(target.outputDirectory, target.pdfPath),
          png: slides.map((slide, index) =>
            path.relative(
              target.outputDirectory,
              path.join(
                target.pngDirectory,
                `${String(index + 1).padStart(2, "0")}-${slide.id}.png`,
              ),
            ),
          ),
        },
        layer: target.layer,
        presentationId: target.presentationId,
        repositoryIdentity: target.repositoryIdentity ?? null,
        slideSize: { height: HEIGHT, width: WIDTH },
        source: "apps/studio/workspace/utils/stories/products.stories.tsx",
        storyId: STORY_ID,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `Generated ${slides.length} HTML-first presentation slides in ${path.relative(repositoryRoot, target.outputDirectory)} (${target.layer}).`,
  );
}

await main();
