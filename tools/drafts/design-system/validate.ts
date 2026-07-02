import { access, readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";

import { collectModuleInventory, readBlockManifests } from "./inventory";

const ROOT = process.cwd();
const DESIGN_SYSTEM_ROOT = path.join(ROOT, "apps", "drafts");
const MODULES_ROOT = path.join(DESIGN_SYSTEM_ROOT, "modules");
const PAGES_ROOT = path.join(
  DESIGN_SYSTEM_ROOT,
  "modules",
  "host",
  "models",
  "page",
);
const SKIP_DIRS = new Set(["node_modules", ".git", ".nx"]);

interface ValidationFailure {
  filePath: string;
  errors: string[];
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

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

async function readJson(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function walkForFileName(
  dir: string,
  fileName: string,
  output: string[],
): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      await walkForFileName(entryPath, fileName, output);
      continue;
    }

    if (entry.isFile() && entry.name === fileName) {
      output.push(entryPath);
    }
  }
}

function addError(
  failures: ValidationFailure[],
  filePath: string,
  error: string,
): void {
  const existing = failures.find((failure) => failure.filePath === filePath);
  if (existing) {
    existing.errors.push(error);
    return;
  }

  failures.push({
    filePath,
    errors: [error],
  });
}

function isStorybookDiscoverableStoryPath(relativeFile: string): boolean {
  return /\.stories\.(ts|tsx|mdx)$/.test(toPosixPath(relativeFile));
}

async function validateRootManifest(
  failures: ValidationFailure[],
): Promise<void> {
  const manifestPath = path.join(DESIGN_SYSTEM_ROOT, "system.manifest.json");

  try {
    const json = (await readJson(manifestPath)) as {
      id?: unknown;
      title?: unknown;
      version?: unknown;
      state?: unknown;
      runtime?: { css?: unknown; js?: unknown };
      foundations?: { tokens?: unknown; figmaVariables?: unknown };
      inventory?: { modules?: unknown };
      modulesRoot?: unknown;
      pagesRoot?: unknown;
      storybook?: { configDir?: unknown };
    };

    for (const key of ["id", "title", "version", "state"] as const) {
      if (typeof json[key] !== "string" || !json[key]) {
        addError(failures, manifestPath, `"${key}" must be a non-empty string`);
      }
    }

    const referencedFiles = [
      json.runtime?.css,
      json.runtime?.js,
      json.foundations?.tokens,
      json.foundations?.figmaVariables,
      json.inventory?.modules,
    ];

    for (const referencedFile of referencedFiles) {
      if (typeof referencedFile !== "string" || !referencedFile) {
        addError(failures, manifestPath, "referenced file path is missing");
        continue;
      }

      const absolutePath = path.join(DESIGN_SYSTEM_ROOT, referencedFile);
      if (!(await pathPointsToFile(absolutePath))) {
        addError(
          failures,
          manifestPath,
          `referenced file does not exist: ${referencedFile}`,
        );
      }
    }

    for (const referencedDir of [
      json.modulesRoot,
      json.pagesRoot,
      json.storybook?.configDir,
    ]) {
      if (typeof referencedDir !== "string" || !referencedDir) {
        addError(
          failures,
          manifestPath,
          "referenced directory path is missing",
        );
        continue;
      }

      const absolutePath = path.join(DESIGN_SYSTEM_ROOT, referencedDir);
      if (!(await pathPointsToDirectory(absolutePath))) {
        addError(
          failures,
          manifestPath,
          `referenced directory does not exist: ${referencedDir}`,
        );
      }
    }
  } catch (error) {
    addError(
      failures,
      manifestPath,
      `invalid JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

async function validateBlocks(failures: ValidationFailure[]): Promise<void> {
  const manifestPaths: string[] = [];
  await walkForFileName(MODULES_ROOT, "block.manifest.json", manifestPaths);
  const blockManifests = await readBlockManifests();
  const blockIds = new Set<string>();

  const inventory = await collectModuleInventory();
  const variantKeys = new Set<string>();

  for (const moduleRecord of inventory.modules) {
    for (const entity of moduleRecord.entities) {
      for (const variant of entity.variants) {
        variantKeys.add(
          [
            entity.module,
            entity.entityType,
            entity.entity,
            variant.variant,
          ].join(":"),
        );
      }
    }
  }

  for (const manifestPath of manifestPaths.sort()) {
    try {
      const json = (await readJson(manifestPath)) as {
        id?: unknown;
        layer?: unknown;
        state?: unknown;
        source?: {
          module?: unknown;
          entityType?: unknown;
          entity?: unknown;
          variant?: unknown;
        };
        files?: {
          component?: unknown;
          story?: unknown;
          html?: unknown;
          css?: unknown;
          js?: unknown;
        };
        figma?: {
          metadataFile?: unknown;
        };
      };

      if (typeof json.id !== "string" || !json.id) {
        addError(failures, manifestPath, "id must be a non-empty string");
      } else if (
        (json.layer === "singlepage" || json.layer === "startup") &&
        blockIds.has(`${json.layer}:${json.id}`)
      ) {
        addError(
          failures,
          manifestPath,
          `duplicate block id in ${json.layer}: ${json.id}`,
        );
      } else {
        blockIds.add(
          json.layer === "singlepage" || json.layer === "startup"
            ? `${json.layer}:${json.id}`
            : json.id,
        );
      }

      if (json.layer !== "singlepage" && json.layer !== "startup") {
        addError(failures, manifestPath, "layer must be singlepage or startup");
      }

      if (
        json.state !== "scaffold" &&
        json.state !== "draft" &&
        json.state !== "ready"
      ) {
        addError(
          failures,
          manifestPath,
          "state must be scaffold, draft, or ready",
        );
      }

      const sourceKey = [
        json.source?.module,
        json.source?.entityType,
        json.source?.entity,
        json.source?.variant,
      ].join(":");

      if (
        typeof json.source?.module !== "string" ||
        (json.source.entityType !== "model" &&
          json.source.entityType !== "relation") ||
        typeof json.source.entity !== "string" ||
        typeof json.source.variant !== "string"
      ) {
        addError(failures, manifestPath, "source is incomplete");
      } else if (json.state === "ready" && !variantKeys.has(sourceKey)) {
        addError(
          failures,
          manifestPath,
          `"source" does not match a discovered module variant: ${sourceKey}`,
        );
      }

      if (
        typeof json.source?.module === "string" &&
        (json.source.entityType === "model" ||
          json.source.entityType === "relation") &&
        typeof json.source.entity === "string"
      ) {
        const collection =
          json.source.entityType === "model" ? "models" : "relations";
        const relativeManifestDir = toPosixPath(
          path.relative(DESIGN_SYSTEM_ROOT, path.dirname(manifestPath)),
        );
        const expectedPrefix = [
          "modules",
          json.source.module,
          collection,
          json.source.entity,
          json.layer === "startup" ? "startup" : "singlepage",
          "",
        ].join("/");

        if (!relativeManifestDir.startsWith(expectedPrefix)) {
          addError(
            failures,
            manifestPath,
            `block path must start with ${expectedPrefix}`,
          );
        }
      }

      for (const field of ["component", "story"] as const) {
        const relativeFile = json.files?.[field];
        if (typeof relativeFile !== "string" || !relativeFile) {
          addError(failures, manifestPath, `"files.${field}" is required`);
          continue;
        }

        if (
          field === "story" &&
          !isStorybookDiscoverableStoryPath(relativeFile)
        ) {
          addError(
            failures,
            manifestPath,
            `"files.story" must point to a Storybook-discoverable *.stories.ts, *.stories.tsx, or *.stories.mdx file: ${relativeFile}`,
          );
        }

        const absoluteFile = path.join(
          path.dirname(manifestPath),
          relativeFile,
        );
        if (!(await pathPointsToFile(absoluteFile))) {
          addError(
            failures,
            manifestPath,
            `"files.${field}" does not exist: ${relativeFile}`,
          );
        }
      }

      for (const field of ["html", "css", "js"] as const) {
        const relativeFile = json.files?.[field];
        if (relativeFile == null) {
          continue;
        }

        if (typeof relativeFile !== "string" || !relativeFile) {
          addError(failures, manifestPath, `"files.${field}" must be a path`);
          continue;
        }

        const absoluteFile = path.join(
          path.dirname(manifestPath),
          relativeFile,
        );
        if (!(await pathPointsToFile(absoluteFile))) {
          addError(
            failures,
            manifestPath,
            `"files.${field}" does not exist: ${relativeFile}`,
          );
        }
      }

      const metadataFile = json.figma?.metadataFile;
      if (typeof metadataFile !== "string" || !metadataFile) {
        addError(failures, manifestPath, "figma.metadataFile is required");
      } else {
        const absoluteFile = path.join(
          path.dirname(manifestPath),
          metadataFile,
        );
        if (!(await pathPointsToFile(absoluteFile))) {
          addError(
            failures,
            manifestPath,
            `"figma.metadataFile" does not exist: ${metadataFile}`,
          );
        }
      }
    } catch (error) {
      addError(
        failures,
        manifestPath,
        `invalid JSON (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }

  for (const block of blockManifests) {
    const figmaPath = path.join(path.dirname(block.manifestPath), "figma.json");
    try {
      await access(path.join(ROOT, figmaPath));
    } catch {
      addError(
        failures,
        path.join(ROOT, block.manifestPath),
        "figma metadata file is missing",
      );
    }
  }
}

async function validatePages(failures: ValidationFailure[]): Promise<void> {
  const manifestPaths: string[] = [];
  await walkForFileName(PAGES_ROOT, "page.manifest.json", manifestPaths);

  for (const manifestPath of manifestPaths.sort()) {
    try {
      const json = (await readJson(manifestPath)) as {
        id?: unknown;
        files?: {
          component?: unknown;
          story?: unknown;
          html?: unknown;
          css?: unknown;
          js?: unknown;
        };
        blocks?: Array<{
          id?: unknown;
          path?: unknown;
        }>;
      };

      if (typeof json.id !== "string" || !json.id) {
        addError(failures, manifestPath, "id must be a non-empty string");
      }

      for (const field of ["component", "story"] as const) {
        const relativeFile = json.files?.[field];
        if (typeof relativeFile !== "string" || !relativeFile) {
          addError(failures, manifestPath, `"files.${field}" is required`);
          continue;
        }

        if (
          field === "story" &&
          !isStorybookDiscoverableStoryPath(relativeFile)
        ) {
          addError(
            failures,
            manifestPath,
            `"files.story" must point to a Storybook-discoverable *.stories.ts, *.stories.tsx, or *.stories.mdx file: ${relativeFile}`,
          );
        }

        const absoluteFile = path.join(
          path.dirname(manifestPath),
          relativeFile,
        );
        if (!(await pathPointsToFile(absoluteFile))) {
          addError(
            failures,
            manifestPath,
            `"files.${field}" does not exist: ${relativeFile}`,
          );
        }
      }

      for (const field of ["html", "css", "js"] as const) {
        const relativeFile = json.files?.[field];
        if (relativeFile == null) {
          continue;
        }

        if (typeof relativeFile !== "string" || !relativeFile) {
          addError(failures, manifestPath, `"files.${field}" must be a path`);
          continue;
        }

        const absoluteFile = path.join(
          path.dirname(manifestPath),
          relativeFile,
        );
        if (!(await pathPointsToFile(absoluteFile))) {
          addError(
            failures,
            manifestPath,
            `"files.${field}" does not exist: ${relativeFile}`,
          );
        }
      }

      if (json.blocks != null && !Array.isArray(json.blocks)) {
        addError(failures, manifestPath, "blocks must be an array");
      }

      if (Array.isArray(json.blocks)) {
        for (const block of json.blocks) {
          if (typeof block.id !== "string" || !block.id) {
            addError(failures, manifestPath, "page block is missing id");
          }

          if (typeof block.path !== "string" || !block.path) {
            addError(failures, manifestPath, "page block is missing path");
            continue;
          }

          const blockPath = path.join(path.dirname(manifestPath), block.path);
          if (!(await pathPointsToDirectory(blockPath))) {
            addError(
              failures,
              manifestPath,
              `page block path does not exist: ${block.path}`,
            );
          }

          const blockManifest = path.join(blockPath, "block.manifest.json");
          if (!(await pathPointsToFile(blockManifest))) {
            addError(
              failures,
              manifestPath,
              `page block has no block.manifest.json: ${block.path}`,
            );
          }
        }
      }
    } catch (error) {
      addError(
        failures,
        manifestPath,
        `invalid JSON (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }
}

async function main(): Promise<void> {
  const failures: ValidationFailure[] = [];

  await validateRootManifest(failures);
  await validateBlocks(failures);
  await validatePages(failures);

  if (failures.length) {
    for (const failure of failures) {
      console.error(`\n${toPosixPath(path.relative(ROOT, failure.filePath))}`);
      for (const error of failure.errors) {
        console.error(`  - ${error}`);
      }
    }

    process.exit(1);
  }

  console.log("Drafts design system validation OK.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
