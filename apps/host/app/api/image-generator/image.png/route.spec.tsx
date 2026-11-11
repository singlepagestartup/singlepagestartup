import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Exercise the route's image-source boundary in Bun, which supports the font
 * import.meta URLs used by Next. Rendering and SDK transport are substituted;
 * payload decoding, template checks and raster-byte detection are production code.
 */
it("renders saved raster templates without trusting caller image URLs or adding credentials", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import { mock } from "bun:test";
import pako from "pako";
import { NextRequest } from "next/server";

const id = "00000000-0000-4000-8000-000000000001";
const variant = "generate-template-ecommerce-order-receipt-default";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=", "base64");
let template;
let blob;
let denied;
let calls;
let rendered;

mock.module("@sps/file-storage/models/file/sdk/server", () => ({
  api: {
    async findById(props) {
      calls.push(["findById", props]);
      if (denied) {
        throw new Error("Permission error. Template access denied");
      }
      return template;
    },
    async content(props) {
      calls.push(["content", props]);
      return blob;
    },
  },
}));
mock.module("next/og", () => ({
  ImageResponse: class extends Response {
    constructor(element) {
      super("rendered", { status: 200 });
      rendered = element.props;
    }
  },
}));
globalThis.fetch = async () => {
  throw new Error("Unexpected raw network request");
};
console.error = () => undefined;
const { GET } = await import("./apps/host/app/api/image-generator/image.png/route.tsx");
process.chdir("apps/host");

function reset() {
  template = { id, variant, size: png.length };
  blob = new Blob([png], { type: "text/html" });
  denied = false;
  calls = [];
  rendered = undefined;
}

function request(file = { id, file: "http://169.254.169.254/latest/meta-data/" }, requestedVariant = variant) {
  const data = Buffer.from(pako.deflate(JSON.stringify({ fileStorage: { file } }))).toString("base64");
  const query = new URLSearchParams({ variant: requestedVariant, data, backgroundImage: "http://127.0.0.1/secret" });
  return new NextRequest("http://localhost/api/image-generator/image.png?" + query);
}

for (const requestedVariant of [variant, "generate-template-ecommerce-product-attachment-default"]) {
  reset();
  template.variant = requestedVariant;
  assert.equal((await GET(request(undefined, requestedVariant))).status, 200);
  assert.equal(rendered.backgroundImage, "data:image/png;base64," + png.toString("base64"));
  assert.deepEqual(calls.map(([method]) => method), ["findById", "content"]);
  for (const [, props] of calls) {
    assert.equal(props.id, id);
    assert.equal(props.host, undefined);
    assert.equal(props.options?.headers, undefined);
  }
}

for (const invalid of ["../secret", "http://127.0.0.1/secret", "00000000-0000-4000-8000-000000000001/../../secret"]) {
  reset();
  assert.equal((await GET(request({ id: invalid }))).status, 404);
  assert.equal(calls.length, 0);
}

for (const kind of ["missing", "wrong-variant", "large-metadata", "denied"]) {
  reset();
  if (kind === "missing") { template = undefined; }
  if (kind === "wrong-variant") { template.variant = "default"; }
  if (kind === "large-metadata") { template.size = 5 * 1024 * 1024 + 1; }
  if (kind === "denied") { denied = true; }
  const response = await GET(request());
  assert.equal(response.status, 404);
  assert.equal(calls.length, 1);
  assert.equal(rendered, undefined);
  assert.equal((await response.json()).error, "Not Found error. Template unavailable");
}

for (const bytes of [Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), Buffer.from("<html>secret</html>"), Buffer.alloc(5 * 1024 * 1024 + 1)]) {
  reset();
  blob = new Blob([bytes], { type: "image/png" });
  assert.equal((await GET(request())).status, 404);
  assert.equal(rendered, undefined);
}

reset();
assert.equal((await GET(request(undefined, "generate-template-opengraph-image-default"))).status, 200);
assert(rendered.backgroundImage.startsWith("data:image/svg+xml;base64,"));
assert.equal(calls.length, 0);
console.log("PASS: 13 image-source boundary scenarios");
`;
  const result = spawnSync(
    "bun",
    ["--tsconfig-override", "tsconfig.base.json", "--eval", script],
    {
      cwd: resolve(__dirname, "../../../../../.."),
      encoding: "utf8",
      timeout: 30000,
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || String(result.error));
  }

  expect(result.stdout).toContain("PASS: 13 image-source boundary scenarios");
}, 35000);
