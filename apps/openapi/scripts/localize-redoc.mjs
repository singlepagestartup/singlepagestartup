#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";

const CDN_URL =
  process.env.REDOC_CDN_URL ??
  "https://cdn.redocly.com/redoc/v2.5.1/bundles/redoc.standalone.js";
const distDir = new URL("../dist/", import.meta.url);
const htmlPath = new URL("../dist/index.html", import.meta.url);
const bundlePath = new URL("../dist/redoc.standalone.js", import.meta.url);

async function downloadBundle() {
  const response = await fetch(CDN_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to download Redoc bundle from ${CDN_URL}: ${response.status} ${response.statusText}`,
    );
  }

  const source = await response.text();
  await writeFile(bundlePath, source, "utf8");
}

async function rewriteHtml() {
  const html = await readFile(htmlPath, "utf8");
  const matcher =
    /<script src="https:\/\/cdn\.redocly\.com\/redoc\/[^\"]+"><\/script>/;

  if (!matcher.test(html)) {
    throw new Error("Could not find Redoc CDN script tag in dist/index.html");
  }

  const updated = html.replace(
    matcher,
    '<script src="redoc.standalone.js"></script>',
  );

  await writeFile(htmlPath, updated, "utf8");
}

(async () => {
  await mkdir(distDir, { recursive: true });
  await downloadBundle();
  await rewriteHtml();
  console.log(
    `Redoc bundle localized to dist/redoc.standalone.js (source: ${CDN_URL})`,
  );
})();
