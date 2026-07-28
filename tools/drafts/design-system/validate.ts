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
const VALID_FIGMA_SYNC_STATUSES = new Set([
  "not-created",
  "created",
  "needs-update",
  "verified",
]);

interface ValidationFailure {
  filePath: string;
  errors: string[];
}

interface DraftFigmaManifest {
  componentName?: unknown;
  pageName?: unknown;
  variantName?: unknown;
  nodeId?: unknown;
  variantNodeId?: unknown;
  syncStatus?: unknown;
  metadataFile?: unknown;
}

interface DraftFigmaJson {
  componentName?: unknown;
  pageName?: unknown;
  nodeId?: unknown;
  variantNodeId?: unknown;
  variantName?: unknown;
  metadata?: unknown;
}

interface DraftFigmaSource {
  module?: unknown;
  entityType?: unknown;
  entity?: unknown;
  variant?: unknown;
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

function addMismatch(
  failures: ValidationFailure[],
  filePath: string,
  field: string,
  expected: unknown,
  actual: unknown,
): void {
  if (expected !== actual) {
    addError(
      failures,
      filePath,
      `${field} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function isNullableNodeId(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isStorybookDiscoverableStoryPath(relativeFile: string): boolean {
  return /\.stories\.(ts|tsx|mdx)$/.test(toPosixPath(relativeFile));
}

async function validateFigmaMetadataPair(
  failures: ValidationFailure[],
  options: {
    manifestPath: string;
    kind: "block" | "page";
    id: string | undefined;
    layer: string | undefined;
    files: { component?: unknown; story?: unknown };
    figma: DraftFigmaManifest | undefined;
    source: DraftFigmaSource;
  },
): Promise<void> {
  const { manifestPath, kind, id, layer, files, figma, source } = options;
  const manifestDir = path.dirname(manifestPath);
  const metadataFile = figma?.metadataFile;

  if (typeof metadataFile !== "string" || !metadataFile) {
    return;
  }

  for (const field of ["componentName", "pageName", "variantName"] as const) {
    if (typeof figma?.[field] !== "string" || !figma[field]) {
      addError(failures, manifestPath, `figma.${field} is required`);
    }
  }

  if (!isNullableNodeId(figma?.nodeId)) {
    addError(failures, manifestPath, "figma.nodeId must be a string or null");
  }

  if (!isNullableNodeId(figma?.variantNodeId)) {
    addError(
      failures,
      manifestPath,
      "figma.variantNodeId must be a string or null",
    );
  }

  if (
    typeof figma?.syncStatus !== "string" ||
    !VALID_FIGMA_SYNC_STATUSES.has(figma.syncStatus)
  ) {
    addError(
      failures,
      manifestPath,
      "figma.syncStatus must be not-created, created, needs-update, or verified",
    );
  }

  const figmaPath = path.join(manifestDir, metadataFile);
  let figmaJson: DraftFigmaJson;

  try {
    figmaJson = (await readJson(figmaPath)) as DraftFigmaJson;
  } catch (error) {
    addError(
      failures,
      manifestPath,
      `invalid figma metadata JSON (${error instanceof Error ? error.message : String(error)})`,
    );
    return;
  }

  for (const field of [
    "componentName",
    "pageName",
    "nodeId",
    "variantNodeId",
    "variantName",
  ] as const) {
    addMismatch(
      failures,
      manifestPath,
      `figma.${field}`,
      figma?.[field],
      figmaJson[field],
    );
  }

  if (
    figmaJson.metadata == null ||
    typeof figmaJson.metadata !== "object" ||
    Array.isArray(figmaJson.metadata)
  ) {
    addError(failures, figmaPath, "metadata must be an object");
    return;
  }

  const metadata = figmaJson.metadata as Record<string, unknown>;
  const syncKey = toPosixPath(path.relative(MODULES_ROOT, manifestDir));
  const componentPath =
    typeof files.component === "string"
      ? toPosixPath(
          path.relative(ROOT, path.join(manifestDir, files.component)),
        )
      : undefined;
  const storyPath =
    typeof files.story === "string"
      ? toPosixPath(path.relative(ROOT, path.join(manifestDir, files.story)))
      : undefined;
  const expectedSource =
    kind === "page"
      ? {
          module: "host",
          entityType: "model",
          entity: "page",
          variant: id,
        }
      : source;
  const expectedBlockId = kind === "page" ? `host.page.${id}` : id;

  const expectedMetadata: Record<string, unknown> = {
    "sps.drafts.blockId": expectedBlockId,
    "sps.drafts.layer": layer,
    "sps.drafts.syncKey": syncKey,
    "sps.figma.component": figma?.componentName,
    "sps.figma.variant": figma?.variantName,
    "sps.source.module": expectedSource.module,
    "sps.source.entityType": expectedSource.entityType,
    "sps.source.entity": expectedSource.entity,
    "sps.source.variant": expectedSource.variant,
    "sps.contractVersion": "0.1.0",
    "sps.code.component": componentPath,
    "sps.code.story": storyPath,
  };

  for (const [field, expected] of Object.entries(expectedMetadata)) {
    if (typeof expected !== "string" || !expected) {
      continue;
    }

    addMismatch(
      failures,
      figmaPath,
      `metadata.${field}`,
      expected,
      metadata[field],
    );
  }
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
        figma?: DraftFigmaManifest;
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

      await validateFigmaMetadataPair(failures, {
        manifestPath,
        kind: "block",
        id: typeof json.id === "string" ? json.id : undefined,
        layer: typeof json.layer === "string" ? json.layer : undefined,
        files: json.files ?? {},
        figma: json.figma,
        source: json.source ?? {},
      });
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
        layer?: unknown;
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
        figma?: DraftFigmaManifest;
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

      await validateFigmaMetadataPair(failures, {
        manifestPath,
        kind: "page",
        id: typeof json.id === "string" ? json.id : undefined,
        layer: typeof json.layer === "string" ? json.layer : undefined,
        files: json.files ?? {},
        figma: json.figma,
        source: {
          module: "host",
          entityType: "model",
          entity: "page",
          variant: json.id,
        },
      });
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
