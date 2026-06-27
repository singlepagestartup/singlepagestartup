import { readdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

export interface ModuleVariantRecord {
  variant: string;
  scope: string;
  variantsFile: string;
  coveredBy: string[];
}

export interface ModuleEntityRecord {
  module: string;
  entityType: "model" | "relation";
  entity: string;
  componentRoot: string;
  variants: ModuleVariantRecord[];
}

export interface ModuleRecord {
  name: string;
  entities: ModuleEntityRecord[];
}

export interface BlockManifestSource {
  module: string;
  entityType: "model" | "relation" | "module";
  entity: string;
  variant: string;
}

export interface BlockManifestRecord {
  id: string;
  layer: "singlepage" | "startup";
  source: BlockManifestSource;
  manifestPath: string;
}

export interface GeneratedModuleInventory {
  generatedAt: string;
  modulesRoot: string;
  draftsRoot: string;
  totals: {
    modules: number;
    entities: number;
    variants: number;
    coveredVariants: number;
  };
  modules: ModuleRecord[];
}

const ROOT = process.cwd();
const MODULES_ROOT = path.join(ROOT, "libs", "modules");
const DESIGN_SYSTEM_ROOT = path.join(ROOT, "apps", "drafts");
const OUTPUT_PATH = path.join(
  DESIGN_SYSTEM_ROOT,
  "inventory",
  "modules.generated.json",
);
const SKIP_DIRS = new Set(["node_modules", ".git", ".nx", "dist"]);

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(
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

      await walk(entryPath, fileName, output);
      continue;
    }

    if (entry.isFile() && entry.name === fileName) {
      output.push(entryPath);
    }
  }
}

function parseVariantKeys(source: string): string[] {
  const objectMatch = source.match(
    /export\s+const\s+variants\s*=\s*\{([\s\S]*?)\};/,
  );
  if (!objectMatch) {
    return [];
  }

  const withoutComments = objectMatch[1]
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const keys = new Set<string>();
  const keyPattern =
    /(?:^|,)\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/gm;

  for (const match of withoutComments.matchAll(keyPattern)) {
    const key = match[1] ?? match[2] ?? match[3];
    if (key) {
      keys.add(key);
    }
  }

  return Array.from(keys).sort((left, right) => left.localeCompare(right));
}

function parseEntityFromVariantsPath(filePath: string): {
  module: string;
  entityType: "model" | "relation";
  entity: string;
  componentRoot: string;
  scope: string;
} | null {
  const relative = toPosixPath(path.relative(ROOT, filePath));
  const segments = relative.split("/");
  const moduleIndex = segments.indexOf("modules");

  if (moduleIndex === -1) {
    return null;
  }

  const module = segments[moduleIndex + 1];
  const collection = segments[moduleIndex + 2];
  const entity = segments[moduleIndex + 3];
  const frontendIndex = segments.indexOf("frontend");
  const libIndex = segments.indexOf("lib");

  if (
    !module ||
    !entity ||
    frontendIndex === -1 ||
    libIndex === -1 ||
    (collection !== "models" && collection !== "relations")
  ) {
    return null;
  }

  const scopeSegments = segments.slice(libIndex + 1, -1);
  const scope = scopeSegments.length ? scopeSegments.join("/") : ".";
  const componentRoot = segments.slice(0, frontendIndex + 2).join("/");

  return {
    module,
    entityType: collection === "models" ? "model" : "relation",
    entity,
    componentRoot,
    scope,
  };
}

function sourceKey(source: BlockManifestSource): string {
  return [source.module, source.entityType, source.entity, source.variant].join(
    ":",
  );
}

export async function readBlockManifests(): Promise<BlockManifestRecord[]> {
  const manifestPaths: string[] = [];
  await walk(
    path.join(DESIGN_SYSTEM_ROOT, "modules"),
    "block.manifest.json",
    manifestPaths,
  );

  const records: BlockManifestRecord[] = [];

  for (const manifestPath of manifestPaths.sort()) {
    const raw = await readFile(manifestPath, "utf8");
    const json = JSON.parse(raw) as {
      id?: unknown;
      layer?: unknown;
      source?: Partial<BlockManifestSource>;
    };

    if (
      typeof json.id !== "string" ||
      (json.layer !== "singlepage" && json.layer !== "startup") ||
      typeof json.source?.module !== "string" ||
      (json.source.entityType !== "model" &&
        json.source.entityType !== "relation" &&
        json.source.entityType !== "module") ||
      typeof json.source.entity !== "string" ||
      typeof json.source.variant !== "string"
    ) {
      continue;
    }

    records.push({
      id: json.id,
      layer: json.layer,
      source: {
        module: json.source.module,
        entityType: json.source.entityType,
        entity: json.source.entity,
        variant: json.source.variant,
      },
      manifestPath: toPosixPath(path.relative(ROOT, manifestPath)),
    });
  }

  return records;
}

export async function collectModuleInventory(): Promise<GeneratedModuleInventory> {
  const variantFiles: string[] = [];
  await walk(MODULES_ROOT, "variants.ts", variantFiles);

  const blockManifests = await readBlockManifests();
  const coverageBySource = new Map<string, string[]>();

  for (const block of blockManifests) {
    const key = sourceKey(block.source);
    const existing = coverageBySource.get(key) ?? [];
    existing.push(block.id);
    coverageBySource.set(key, existing);
  }

  const entitiesByKey = new Map<string, ModuleEntityRecord>();

  for (const filePath of variantFiles.sort()) {
    const parsed = parseEntityFromVariantsPath(filePath);
    if (!parsed) {
      continue;
    }

    const raw = await readFile(filePath, "utf8");
    const variants = parseVariantKeys(raw);
    const entityKey = [parsed.module, parsed.entityType, parsed.entity].join(
      ":",
    );
    const entity =
      entitiesByKey.get(entityKey) ??
      ({
        module: parsed.module,
        entityType: parsed.entityType,
        entity: parsed.entity,
        componentRoot: parsed.componentRoot,
        variants: [],
      } satisfies ModuleEntityRecord);

    for (const variant of variants) {
      const coveredBy =
        coverageBySource.get(
          sourceKey({
            module: parsed.module,
            entityType: parsed.entityType,
            entity: parsed.entity,
            variant,
          }),
        ) ?? [];

      entity.variants.push({
        variant,
        scope: parsed.scope,
        variantsFile: toPosixPath(path.relative(ROOT, filePath)),
        coveredBy: coveredBy.sort(),
      });
    }

    entitiesByKey.set(entityKey, entity);
  }

  const moduleMap = new Map<string, ModuleRecord>();

  for (const entity of Array.from(entitiesByKey.values()).sort((left, right) =>
    [left.module, left.entityType, left.entity]
      .join(":")
      .localeCompare([right.module, right.entityType, right.entity].join(":")),
  )) {
    entity.variants.sort((left, right) =>
      [left.scope, left.variant]
        .join(":")
        .localeCompare([right.scope, right.variant].join(":")),
    );

    const moduleRecord =
      moduleMap.get(entity.module) ??
      ({
        name: entity.module,
        entities: [],
      } satisfies ModuleRecord);

    moduleRecord.entities.push(entity);
    moduleMap.set(entity.module, moduleRecord);
  }

  const modules = Array.from(moduleMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const entities = modules.flatMap((moduleRecord) => moduleRecord.entities);
  const variants = entities.flatMap((entity) => entity.variants);

  return {
    generatedAt: new Date().toISOString(),
    modulesRoot: toPosixPath(path.relative(ROOT, MODULES_ROOT)),
    draftsRoot: toPosixPath(path.relative(ROOT, DESIGN_SYSTEM_ROOT)),
    totals: {
      modules: modules.length,
      entities: entities.length,
      variants: variants.length,
      coveredVariants: variants.filter(
        (variant) => variant.coveredBy.length > 0,
      ).length,
    },
    modules,
  };
}

async function main(): Promise<void> {
  const inventory = await collectModuleInventory();
  const outputDir = path.dirname(OUTPUT_PATH);

  if (!(await pathExists(path.join(outputDir, "..", "system.manifest.json")))) {
    throw new Error(
      `Design system manifest was not found in ${DESIGN_SYSTEM_ROOT}`,
    );
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(inventory, null, 2)}\n`);

  console.log(
    [
      `Generated ${toPosixPath(path.relative(ROOT, OUTPUT_PATH))}`,
      `modules=${inventory.totals.modules}`,
      `entities=${inventory.totals.entities}`,
      `variants=${inventory.totals.variants}`,
      `covered=${inventory.totals.coveredVariants}`,
    ].join(" "),
  );
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
