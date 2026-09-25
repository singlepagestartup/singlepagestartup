/**
 * BDD Suite: Browser HTML to PDF visual regression
 * Given a deterministic React page rendered by Chromium with local fonts and images
 * When its public download hook builds a PDF and Poppler renders page one
 * Then a native lossless browser screenshot matches the PDF within a 2% threshold
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require(
  require.resolve("playwright", {
    paths: process.env.PDF_VISUAL_NODE_MODULES
      ? [process.env.PDF_VISUAL_NODE_MODULES]
      : undefined,
  }),
);
const output = path.resolve(process.env.PDF_VISUAL_OUTPUT ?? "tmp/pdf-visual");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PDF_VISUAL_BROWSER || undefined,
});
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 900 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.PDF_VISUAL_URL ?? "http://127.0.0.1:4330", {
    waitUntil: "networkidle",
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.getByTestId("pdf-fixture").screenshot({
    path: path.join(output, "source.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Generate PDF", exact: true }).click();
  const link = page.getByRole("link", { name: "Download PDF", exact: true });
  await link.waitFor({ state: "visible", timeout: 30_000 });
  if (!(await link.getAttribute("href")).startsWith("blob:")) {
    throw new Error("Expected a Blob URL download");
  }
  const downloadPromise = page.waitForEvent("download");
  await link.click();
  const download = await downloadPromise;
  await download.saveAs(path.join(output, "fixture.pdf"));
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  const check = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./compare.test.mjs", import.meta.url))],
    { stdio: "inherit", env: { ...process.env, PDF_VISUAL_OUTPUT: output } },
  );
  if (check.error) {
    throw check.error;
  }
  if (check.status !== 0) {
    throw new Error("HTML/PDF visual comparison failed");
  }
} finally {
  await browser.close();
}
