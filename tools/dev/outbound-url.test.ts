/**
 * Real Bun sockets, TLS and File Storage writes in an isolated Docker network.
 * The fixture IP must be public-shaped but assigned only to the test container.
 * See libs/modules/file-storage/models/file/README.md for the command.
 */
import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const publicAddress = process.env.SPS_TEST_PUBLIC_IP;
const certificates = process.env.SPS_TEST_CERTIFICATES;

if (!publicAddress || !certificates) {
  throw new Error(
    "Run this test in the isolated Docker network documented in the File Storage README",
  );
}

const scratch = mkdtempSync(join(tmpdir(), "sps-outbound-"));
mkdirSync(join(scratch, "stored"));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
  "base64",
);
const settings = {
  API_SERVICE_URL: "http://api.internal:4000",
  NEXT_PUBLIC_API_SERVICE_URL: "https://api.internal",
  HOST_SERVICE_URL: "http://127.0.0.1:39001",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.internal",
  OUTBOUND_URL_ALLOWED_ORIGINS: "",
  OUTBOUND_URL_TIMEOUT_MS: 250,
  OUTBOUND_URL_MAX_RESPONSE_BYTES: 4096,
  FILE_STORAGE_MAX_UPLOAD_BYTES: 1024,
  FILE_STORAGE_PROVIDER: "local",
  FILE_STORAGE_FOLDER: "test",
};
let dnsDelay = 0;
let dnsCalls = 0;
let trapHits = 0;
let publicHits = 0;
let proxyHits = 0;
let streamCancelled = false;
const storedRecords: Record<string, unknown>[] = [];

mock.module("@sps/shared-utils", () => settings);
mock.module("node:dns/promises", () => ({
  async lookup(hostname: string) {
    dnsCalls += 1;

    if (dnsDelay) {
      await Bun.sleep(dnsDelay);
    }

    const address = hostname.endsWith(".internal") ? "10.0.0.8" : publicAddress;
    return [{ address, family: 4 }];
  },
}));

// Import after the fixture configuration; the production transport is not mocked.
const { fetchOutboundUrl } = await import(
  "../../libs/shared/backend/utils/src/lib/outbound-url"
);
const { util: getHttpErrorType } = await import(
  "../../libs/shared/backend/utils/src/lib/http-error"
);
mock.module("@sps/backend-utils", () => ({
  fetchOutboundUrl,
  getHttpErrorType,
  logger: { error() {} },
}));
const { Provider: LocalProvider } = await import(
  "../../libs/providers/file-storage/src/lib/local"
);
mock.module("@sps/providers-file-storage", () => ({
  Provider: class extends LocalProvider {
    constructor(props: { folder: string }) {
      super(props);
      this.filesPath = join(scratch, "stored");
    }
  },
}));
const { Handler } = await import(
  "../../libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url"
);
mock.module("@sps/shared-backend-api", () => ({ CRUDService: class {} }));
const { Service: FileService } = await import(
  "../../libs/modules/file-storage/models/file/backend/app/api/src/lib/service/singlepage"
);
const fileService = new FileService();
const api = new Hono();
const handler = new Handler({
  async create(props: { data: Record<string, unknown> }) {
    storedRecords.push(props.data);
    return { id: "fixture-file", ...props.data };
  },
} as any);
api.post("/import", (context) => handler.execute(context, undefined));
api.onError((error, context) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  return context.text("Internal server error", 500);
});

const tls = {
  key: readFileSync(join(certificates, "key.pem")),
  cert: readFileSync(join(certificates, "cert.pem")),
};
const https = Bun.serve({
  hostname: publicAddress,
  port: 0,
  tls,
  fetch: serveFixture,
});
const http = Bun.serve({
  hostname: publicAddress,
  port: 0,
  fetch: serveFixture,
});
const trap = Bun.serve({
  hostname: "127.0.0.1",
  port: https.port,
  tls,
  fetch() {
    trapHits += 1;
    return new Response("private service");
  },
});
const proxy = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch() {
    proxyHits += 1;
    return new Response("proxy");
  },
});
const untrusted = Bun.serve({
  hostname: publicAddress,
  port: 0,
  tls: {
    key: readFileSync(join(certificates, "untrusted-key.pem")),
    cert: readFileSync(join(certificates, "untrusted-cert.pem")),
  },
  fetch: serveFixture,
});
const host = Bun.serve({
  hostname: "127.0.0.1",
  port: 39001,
  fetch: serveFixture,
});
settings.HOST_SERVICE_URL = host.url.origin;

function fixtureUrl(path: string, hostname = "download.test", secure = true) {
  const server = secure ? https : http;
  return `${secure ? "https" : "http"}://${hostname}:${server.port}${path}`;
}

async function serveFixture(request: Request) {
  publicHits += 1;
  const url = new URL(request.url);

  if (url.pathname === "/import") {
    return api.fetch(request);
  }

  if (url.pathname === "/redirect-private") {
    return Response.redirect(trap.url.href, 302);
  }

  if (url.pathname === "/headers-move") {
    return Response.redirect(fixtureUrl("/echo", "other.test"), 302);
  }

  if (url.pathname === "/cross-body") {
    return Response.redirect(fixtureUrl("/echo", "other.test"), 307);
  }

  if (url.pathname === "/same-body") {
    return new Response(null, { status: 307, headers: { location: "/echo" } });
  }

  if (url.pathname === "/loop") {
    return new Response(null, { status: 302, headers: { location: "/loop" } });
  }

  if (url.pathname === "/echo") {
    return Response.json({
      headers: Object.fromEntries(request.headers),
      method: request.method,
      body: await request.text(),
    });
  }

  if (url.pathname === "/stall") {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
        },
        cancel() {
          streamCancelled = true;
        },
      }),
    );
  }

  if (url.pathname === "/stream") {
    return new Response(
      new ReadableStream({
        async pull(controller) {
          await Bun.sleep(5);
          controller.enqueue(new Uint8Array(256));
        },
        cancel() {
          streamCancelled = true;
        },
      }),
    );
  }

  if (url.pathname === "/bomb") {
    return new Response(gzipSync(Buffer.alloc(100000, 65)), {
      headers: { "content-encoding": "gzip" },
    });
  }

  const codecs = {
    gzip: gzipSync,
    deflate: deflateSync,
    br: brotliCompressSync,
  };
  const codec = codecs[url.pathname.slice(1) as keyof typeof codecs];

  if (codec) {
    return new Response(codec(png), {
      headers: {
        "content-encoding": url.pathname.slice(1),
        "content-type": "image/png",
      },
    });
  }

  if (url.pathname === "/missing") {
    return new Response("private error details", { status: 404 });
  }

  return new Response(png, { headers: { "content-type": "image/png" } });
}

async function importFile(url: unknown) {
  const body = new FormData();
  body.set("data", JSON.stringify({ url }));
  return fetch(`${http.url.origin}/import`, { method: "POST", body });
}

beforeEach(() => {
  dnsDelay = 0;
  dnsCalls = 0;
  trapHits = 0;
  publicHits = 0;
  proxyHits = 0;
  streamCancelled = false;
  storedRecords.length = 0;
});

afterAll(() => {
  for (const server of [https, http, trap, proxy, untrusted, host]) {
    server.stop(true);
  }

  rmSync(scratch, { recursive: true, force: true });
});

test("HTTPS uses the checked IP, while ordinary localhost fetch reaches the private trap", async () => {
  expect(
    await (await fetch(trap.url.href.replace("127.0.0.1", "localhost"))).text(),
  ).toBe("private service");
  const response = await fetchOutboundUrl(fixtureUrl("/file.png", "localhost"));
  expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
  expect(trapHits).toBe(1);
  expect(dnsCalls).toBe(1);
});

test("HTTP uses the checked IP and original Host", async () => {
  const response = await fetchOutboundUrl(
    fixtureUrl("/echo", "download.test", false),
  );
  expect((await response.json()).headers.host).toBe(
    `download.test:${http.port}`,
  );
});

test("TLS refuses a wrong hostname even if caller tries to disable verification", async () => {
  await expect(
    fetchOutboundUrl(fixtureUrl("/file.png", "wrong.test"), {
      tls: { rejectUnauthorized: false },
    } as any),
  ).rejects.toThrow();
  expect(publicHits).toBe(0);
});

test("TLS refuses an untrusted certificate", async () => {
  await expect(
    fetchOutboundUrl(`https://download.test:${untrusted.port}/file.png`),
  ).rejects.toThrow();
  expect(publicHits).toBe(0);
});

test("environment proxy cannot reroute the validated connection", async () => {
  const originalProxy = process.env.HTTPS_PROXY;
  process.env.HTTPS_PROXY = proxy.url.href;

  try {
    const response = await fetchOutboundUrl(fixtureUrl("/file.png"));
    expect(response.status).toBe(200);
    expect(proxyHits).toBe(0);
  } finally {
    if (originalProxy === undefined) {
      delete process.env.HTTPS_PROXY;
    } else {
      process.env.HTTPS_PROXY = originalProxy;
    }
  }
});

test("cross-origin GET strips all caller headers", async () => {
  const response = await fetchOutboundUrl(fixtureUrl("/headers-move"), {
    headers: {
      "X-MCP-Internal-Token-Exchange-Secret": "synthetic-secret",
      "X-Api-Key": "synthetic-key",
      Authorization: "Bearer synthetic-token",
    },
  });
  const data = await response.json();
  expect(data.headers["x-mcp-internal-token-exchange-secret"]).toBeUndefined();
  expect(data.headers["x-api-key"]).toBeUndefined();
  expect(data.headers.authorization).toBeUndefined();
});

test("cross-origin redirect cannot forward a POST body", async () => {
  await expect(
    fetchOutboundUrl(fixtureUrl("/cross-body"), {
      method: "POST",
      body: "synthetic-secret",
    }),
  ).rejects.toThrow("cannot forward");
  expect(publicHits).toBe(1);
});

test("same-origin 307 retains multipart body and credentials", async () => {
  const body = new FormData();
  body.set("data", "synthetic-value");
  const response = await fetchOutboundUrl(fixtureUrl("/same-body"), {
    method: "POST",
    body,
    headers: { "X-RBAC-SECRET-KEY": "synthetic-secret" },
  });
  const data = await response.json();
  expect(data.method).toBe("POST");
  expect(data.body).toContain("synthetic-value");
  expect(data.headers["x-rbac-secret-key"]).toBe("synthetic-secret");
});

test("redirect to a private address never reaches it", async () => {
  await expect(
    fetchOutboundUrl(fixtureUrl("/redirect-private")),
  ).rejects.toThrow("public addresses only");
  expect(trapHits).toBe(0);
});

test("DNS timeout returns before resolution and a late answer starts no connection", async () => {
  dnsDelay = 600;
  const start = performance.now();
  await expect(fetchOutboundUrl(fixtureUrl("/file.png"))).rejects.toThrow(
    "within 250 ms",
  );
  expect(performance.now() - start).toBeLessThan(500);
  await Bun.sleep(650);
  expect(publicHits).toBe(0);
});

test("caller cancellation stops pending DNS", async () => {
  dnsDelay = 600;
  const controller = new AbortController();
  const pending = fetchOutboundUrl(fixtureUrl("/file.png"), {
    signal: controller.signal,
  });
  controller.abort(new Error("caller cancelled"));
  await expect(pending).rejects.toThrow("caller cancelled");
  await Bun.sleep(650);
  expect(publicHits).toBe(0);
});

test("the same deadline bounds a stalled response body", async () => {
  await expect(fetchOutboundUrl(fixtureUrl("/stall"))).rejects.toThrow(
    "within 250 ms",
  );
  await Bun.sleep(20);
  expect(streamCancelled).toBe(true);
});

test("a streaming response stops at the size limit", async () => {
  await expect(
    fetchOutboundUrl(fixtureUrl("/stream"), {}, { maxResponseBytes: 512 }),
  ).rejects.toThrow("512 bytes");
  await Bun.sleep(20);
  expect(streamCancelled).toBe(true);
});

test.each(["gzip", "deflate", "br"])(
  "decodes %s under the size limit",
  async (encoding) => {
    const response = await fetchOutboundUrl(fixtureUrl(`/${encoding}`));
    expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-length")).toBe(String(png.byteLength));
  },
);

test("compressed expansion is limited by decoded bytes", async () => {
  await expect(
    fetchOutboundUrl(fixtureUrl("/bomb"), {}, { maxResponseBytes: 1024 }),
  ).rejects.toThrow("1024 bytes");
});

test("redirect loop stops after five hops", async () => {
  await expect(fetchOutboundUrl(fixtureUrl("/loop"))).rejects.toThrow(
    "more than 5 times",
  );
  expect(publicHits).toBe(6);
});

test("real API handler downloads a public file and writes its original bytes", async () => {
  const response = await importFile(fixtureUrl("/file.png"));
  expect(response.status).toBe(201);
  const record = (await response.json()).data;
  expect(
    readFileSync(join(scratch, "stored", record.file.split("/").pop())),
  ).toEqual(png);
  expect(storedRecords.length).toBe(1);
});

test("image generation retains access to its exact local endpoint", async () => {
  const response = await importFile(
    `${host.url.origin}/api/image-generator/image.png?variant=default`,
  );
  expect(response.status).toBe(201);
});

test.each([
  "file:///etc/hostname",
  "s3://fixture/test",
  "http://169.254.169.254/latest/meta-data/",
  "http://[64:ff9b::7f00:1]/",
  "http://[2002:7f00:1::]/",
  "http://api.internal:4000/private",
])("API refuses unsafe URL and creates no File: %s", async (url) => {
  expect((await importFile(url)).status).toBe(400);
  expect(storedRecords.length).toBe(0);
});

test("API refuses another path on the Host service", async () => {
  expect((await importFile(`${host.url.origin}/private`)).status).toBe(400);
  expect(storedRecords.length).toBe(0);
});

test("API refuses remote errors and compressed oversized files before storage", async () => {
  expect((await importFile(fixtureUrl("/missing"))).status).toBe(400);
  expect((await importFile(fixtureUrl("/bomb"))).status).toBe(413);
  expect(storedRecords.length).toBe(0);
});

// The /:uuid/content handler delegates to this method after finding the record.
test("stored remote file bytes use the same public download guard", async () => {
  expect(
    await fileService.readBytes({ file: fixtureUrl("/file.png") }),
  ).toEqual(png);
});

test("stored metadata cannot make the content endpoint fetch a private service", async () => {
  await expect(fileService.readBytes({ file: trap.url.href })).rejects.toThrow(
    "public addresses only",
  );
  await expect(
    fileService.readBytes({ file: fixtureUrl("/redirect-private") }),
  ).rejects.toThrow("public addresses only");
  expect(trapHits).toBe(0);
});

test("stored remote content also enforces decoded size limits", async () => {
  await expect(
    fileService.readBytes({ file: fixtureUrl("/bomb") }, { maxBytes: 512 }),
  ).rejects.toThrow("512 bytes");
});
