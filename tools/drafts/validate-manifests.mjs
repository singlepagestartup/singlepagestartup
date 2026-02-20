import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DRAFTS_DIR = path.join(ROOT, "apps", "drafts");
const SCAN_DIRS = [
  path.join(DRAFTS_DIR, "incoming"),
  path.join(DRAFTS_DIR, "approved"),
  path.join(DRAFTS_DIR, "archived"),
  path.join(DRAFTS_DIR, "examples"),
];

const VALID_TYPES = new Set(["html", "react", "next"]);
const VALID_STATUSES = new Set(["incoming", "approved", "archived"]);
const REQUIRED = ["id", "title", "type", "entry", "status"];

async function getManifestPaths(baseDir) {
  const result = [];
  let entries = [];

  try {
    entries = await readdir(baseDir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = path.join(baseDir, entry.name, "manifest.json");

    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        result.push(candidate);
      }
    } catch {
      // no manifest in this folder, skip
    }
  }

  return result;
}

function validateManifest(json, filePath) {
  const errors = [];

  for (const key of REQUIRED) {
    if (!(key in json)) {
      errors.push(`missing required field "${key}"`);
    }
  }

  if (json.id && typeof json.id !== "string") {
    errors.push(`"id" must be string`);
  }

  if (json.title && typeof json.title !== "string") {
    errors.push(`"title" must be string`);
  }

  if (json.type && !VALID_TYPES.has(json.type)) {
    errors.push(`"type" must be one of: ${Array.from(VALID_TYPES).join(", ")}`);
  }

  if (json.entry && typeof json.entry !== "string") {
    errors.push(`"entry" must be string`);
  }

  if (json.status && !VALID_STATUSES.has(json.status)) {
    errors.push(
      `"status" must be one of: ${Array.from(VALID_STATUSES).join(", ")}`,
    );
  }

  if (json.tags && !Array.isArray(json.tags)) {
    errors.push(`"tags" must be an array of strings`);
  }

  if (Array.isArray(json.tags) && json.tags.some((tag) => typeof tag !== "string")) {
    errors.push(`"tags" must contain only strings`);
  }

  if (errors.length) {
    return {
      filePath,
      errors,
    };
  }

  return null;
}

async function main() {
  const manifestPaths = (
    await Promise.all(SCAN_DIRS.map((dir) => getManifestPaths(dir)))
  ).flat();

  if (!manifestPaths.length) {
    console.log("No draft manifests found.");
    return;
  }

  const failures = [];

  for (const manifestPath of manifestPaths) {
    try {
      const raw = await readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw);
      const failed = validateManifest(parsed, manifestPath);
      if (failed) {
        failures.push(failed);
      }
    } catch (error) {
      failures.push({
        filePath: manifestPath,
        errors: [`invalid JSON (${String(error)})`],
      });
    }
  }

  if (!failures.length) {
    console.log(`Validated ${manifestPaths.length} draft manifest(s). OK.`);
    return;
  }

  for (const failure of failures) {
    console.error(`\n${failure.filePath}`);
    for (const err of failure.errors) {
      console.error(`  - ${err}`);
    }
  }

  process.exit(1);
}

main();
