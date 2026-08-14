import { stat } from "node:fs/promises";
import * as path from "node:path";

import { discoverStudioProjects } from "./lib/discovery";

const VALID_TYPES = new Set(["html", "react", "next"]);
const VALID_SCOPES = new Set(["singlepage", "startup"]);
const REQUIRED = ["id", "title", "type", "entry", "scope"];

type StudioProjectRecord = Awaited<
  ReturnType<typeof discoverStudioProjects>
>["studioProjects"][number];

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

async function validateManifest(studioProject: StudioProjectRecord): Promise<{
  filePath: string;
  errors: string[];
} | null> {
  const json = studioProject.manifest;
  const filePath = studioProject.manifestPath;
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

  if (json.scope && !VALID_SCOPES.has(json.scope)) {
    errors.push(
      `"scope" must be one of: ${Array.from(VALID_SCOPES).join(", ")}`,
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
    VALID_SCOPES.has(studioProject.scope) &&
    json.scope &&
    json.scope !== studioProject.scope
  ) {
    errors.push(
      `"scope" (${json.scope}) does not match folder scope (${studioProject.scope})`,
    );
  }

  if (typeof json.entry === "string" && json.entry.length > 0) {
    const entryPath = path.resolve(studioProject.studioProjectDir, json.entry);
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
        const runDir = path.resolve(
          studioProject.studioProjectDir,
          json.run.cwd,
        );
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
    const packageJsonPath = path.resolve(
      studioProject.studioProjectDir,
      cwd,
      "package.json",
    );
    if (!(await pathPointsToFile(packageJsonPath))) {
      errors.push(
        `react/next studioProject requires either "run.dev" or package.json at ${packageJsonPath}`,
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
  const { studioProjects, invalidStudioProjects, manifestPaths } =
    await discoverStudioProjects();

  if (!manifestPaths.length) {
    console.log("No studioProject manifests found.");
    return;
  }

  const failures: Array<{ filePath: string; errors: string[] }> =
    invalidStudioProjects.map((invalidStudioProject) => ({
      filePath: invalidStudioProject.manifestPath,
      errors: [`invalid JSON (${invalidStudioProject.error})`],
    }));

  for (const studioProject of studioProjects) {
    const failed = await validateManifest(studioProject);
    if (failed) {
      failures.push(failed);
    }
  }

  if (!failures.length) {
    console.log(
      `Validated ${manifestPaths.length} Studio project manifest(s). OK.`,
    );
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
