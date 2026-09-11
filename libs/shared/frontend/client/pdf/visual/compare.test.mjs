/**
 * BDD Suite: Element PDF visual regression
 * Given an independent native HTML screenshot and its actual downloaded PDF
 * When Poppler renders page one at the screenshot resolution
 * Then geometry, metadata and composition match with at most 2% changed pixels
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
const require = createRequire(import.meta.url);
const paths = process.env.PDF_VISUAL_NODE_MODULES
  ? [process.env.PDF_VISUAL_NODE_MODULES]
  : undefined;
const { PNG } = require(require.resolve("pngjs", { paths }));
const { default: pixelmatch } = await import(
  require.resolve("pixelmatch", { paths })
);
const output = path.resolve(process.env.PDF_VISUAL_OUTPUT ?? "tmp/pdf-visual");
await mkdir(output, { recursive: true });
const pdfPath = path.join(output, "fixture.pdf");
const source = PNG.sync.read(await readFile(path.join(output, "source.png")));
const info = spawnSync("pdfinfo", [pdfPath], { encoding: "utf8" });
if (info.error) {
  throw info.error;
}
assert.equal(info.status, 0, info.stderr);
assert.match(info.stdout, /Pages:\s+1\b/);
assert.match(info.stdout, /Page size:\s+300 x 450 pts/);
assert.match(info.stdout, /Title:\s+Deterministic element PDF/);
assert.match(info.stdout, /Author:\s+SPS/);
assert.match(info.stdout, /Creator:\s+Element PDF fixture/);
assert.match(info.stdout, /Subject:\s+Visual regression/);
assert.equal(
  source.width * 3,
  source.height * 2,
  "HTML screenshot must contain exactly the fixture article",
);
const render = spawnSync(
  "pdftoppm",
  [
    "-f",
    "1",
    "-singlefile",
    "-png",
    "-scale-to-x",
    String(source.width),
    "-scale-to-y",
    String(source.height),
    pdfPath,
    path.join(output, "pdf-page"),
  ],
  { encoding: "utf8" },
);
if (render.error) {
  throw render.error;
}
assert.equal(render.status, 0, render.stderr);
const actual = PNG.sync.read(await readFile(path.join(output, "pdf-page.png")));
assert.deepEqual([actual.width, actual.height], [source.width, source.height]);
const difference = new PNG({ width: source.width, height: source.height });
// Pixelmatch's standard antialias detection excludes glyph-edge smoothing only.
// Neither image is blurred, aligned, stretched, or otherwise corrected to match.
const changed = pixelmatch(
  source.data,
  actual.data,
  difference.data,
  source.width,
  source.height,
  { threshold: 0.1, includeAA: false },
);
const fraction = changed / (source.width * source.height);
const report = {
  size: [source.width, source.height],
  changedPixels: changed,
  changedFraction: fraction,
  maximumChangedFraction: 0.02,
  colorThreshold: 0.1,
  includeAntialias: false,
  passed: fraction <= 0.02,
};
await writeFile(
  path.join(output, "difference.png"),
  PNG.sync.write(difference),
);
await writeFile(
  path.join(output, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
assert.ok(
  report.passed,
  "HTML/PDF composition differs; inspect pdf-page.png and difference.png",
);
