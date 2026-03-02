import { stat } from "node:fs/promises";
import * as path from "node:path";

import { discoverDrafts } from "./lib/discovery";

const VALID_TYPES = new Set(["html", "react", "next"]);
const VALID_STATUSES = new Set(["incoming", "approved", "archived"]);
const REQUIRED = ["id", "title", "type", "entry", "status"];
const COLLECTION_STATUSES = new Set(["incoming", "approved", "archived"]);

type DraftRecord = Awaited<ReturnType<typeof discoverDrafts>>["drafts"][number];

async function pathPointsToFile(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}

async function pathPointsToDirectory(dirPath: string): Promise<boolean> {
  try {
    const info = await stat(dirPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function validateManifest(draft: DraftRecord): Promise<{
  filePath: string;
  errors: string[];
} | null> {
  const json = draft.manifest;
  const filePath = draft.manifestPath;
  const errors: string[] = [];

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

  if (
    Array.isArray(json.tags) &&
    json.tags.some((tag) => typeof tag !== "string")
  ) {
    errors.push(`"tags" must contain only strings`);
  }

  if (
    COLLECTION_STATUSES.has(draft.collection) &&
    json.status &&
    json.status !== draft.collection
  ) {
    errors.push(
      `"status" (${json.status}) does not match folder collection (${draft.collection})`,
    );
  }

  if (typeof json.entry === "string" && json.entry.length > 0) {
    const entryPath = path.resolve(draft.draftDir, json.entry);
    const entryExists = await pathPointsToFile(entryPath);
    if (!entryExists) {
      errors.push(`"entry" file does not exist: ${entryPath}`);
    }
  }

  if (json.run != null) {
    if (typeof json.run !== "object" || Array.isArray(json.run)) {
      errors.push(`"run" must be an object`);
    } else {
      if ("dev" in json.run && typeof json.run.dev !== "string") {
        errors.push(`"run.dev" must be a string command`);
      }

      if (
        "dev" in json.run &&
        typeof json.run.dev === "string" &&
        !json.run.dev.trim()
      ) {
        errors.push(`"run.dev" must not be empty`);
      }

      if ("install" in json.run && typeof json.run.install !== "string") {
        errors.push(`"run.install" must be a string command`);
      }

      if (
        "install" in json.run &&
        typeof json.run.install === "string" &&
        !json.run.install.trim()
      ) {
        errors.push(`"run.install" must not be empty`);
      }

      if (
        "autoInstall" in json.run &&
        typeof json.run.autoInstall !== "boolean"
      ) {
        errors.push(`"run.autoInstall" must be a boolean`);
      }

      if ("cwd" in json.run && typeof json.run.cwd !== "string") {
        errors.push(`"run.cwd" must be a string`);
      }

      if ("cwd" in json.run && typeof json.run.cwd === "string") {
        const runDir = path.resolve(draft.draftDir, json.run.cwd);
        const runDirExists = await pathPointsToDirectory(runDir);
        if (!runDirExists) {
          errors.push(`"run.cwd" directory does not exist: ${runDir}`);
        }
      }

      if ("port" in json.run) {
        if (!Number.isInteger(json.run.port)) {
          errors.push(`"run.port" must be an integer`);
        } else if (json.run.port < 1 || json.run.port > 65535) {
          errors.push(`"run.port" must be between 1 and 65535`);
        }
      }

      if ("host" in json.run && typeof json.run.host !== "string") {
        errors.push(`"run.host" must be a string`);
      }
    }
  }

  if (
    (json.type === "react" || json.type === "next") &&
    json.run?.dev == null
  ) {
    const cwd =
      json.run?.cwd && typeof json.run.cwd === "string" ? json.run.cwd : ".";
    const packageJsonPath = path.resolve(draft.draftDir, cwd, "package.json");
    if (!(await pathPointsToFile(packageJsonPath))) {
      errors.push(
        `react/next draft requires either "run.dev" or package.json at ${packageJsonPath}`,
      );
    }
  }

  if (errors.length) {
    return {
      filePath,
      errors,
    };
  }

  return null;
}

async function main(): Promise<void> {
  const { drafts, invalidDrafts, manifestPaths } = await discoverDrafts();

  if (!manifestPaths.length) {
    console.log("No draft manifests found.");
    return;
  }

  const failures: Array<{ filePath: string; errors: string[] }> =
    invalidDrafts.map((invalidDraft) => ({
      filePath: invalidDraft.manifestPath,
      errors: [`invalid JSON (${invalidDraft.error})`],
    }));

  for (const draft of drafts) {
    const failed = await validateManifest(draft);
    if (failed) {
      failures.push(failed);
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
