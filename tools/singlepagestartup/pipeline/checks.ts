import {
  canonicalHeading,
  canonicalMarkdownHeadings,
} from "../../studio/workspace/headings";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import {
  parseProductCatalog,
  type IProductCatalog,
} from "../../../apps/studio/workspace/utils/products/catalog";
import { parseSalesProcess } from "../../../apps/studio/workspace/utils/products/sales";
import { findUnownedBrandbook } from "../../studio/design/brandbook";
import {
  findTranslatedHeadings,
  findUnformattedDocuments,
} from "../../studio/workspace/document-shape";
import { findChangeLogShapes } from "./change-log";
import {
  findMissingSpecimens,
  findSpecimenDeviations,
} from "../../studio/design/specimens";
import {
  validateProductCatalogFiles,
  validateProductSectionFiles,
} from "../../studio/products/validate";
import {
  parseDocument,
  hasMarkdownContent,
} from "../../studio/workspace/document";
import {
  loadWorkspace,
  type ILoadedWorkspaceEntry,
  type IWorkspaceGraph,
  type WorkspaceLayer,
} from "../../studio/workspace/loader";
import {
  templateSections,
  type IPipelineCheck,
  type IPipelineDefinition,
  type PipelineArtifact,
} from "./definition";

export type CheckStatus = "pass" | "gap" | "skipped";
export type GapClassification = "structural-gap" | "decision-gap";

export interface ICheckResult {
  id: string;
  check: string;
  /** `workspace` marks a result that belongs to no single artifact. */
  artifact: PipelineArtifact | "workspace";
  status: CheckStatus;
  classification?: GapClassification;
  detail: string;
  items?: string[];
}

export interface IPipelineDocument {
  kind: PipelineArtifact;
  resolved: string;
  body: string;
  metadata: Record<string, unknown>;
  /** Frontmatter of the active layer's own source file; inherited metadata never counts for a gate. */
  own: Record<string, unknown>;
  /** Body of the active layer's own source file, empty when the layer inherits everything. */
  ownBody: string;
  ownPath: string;
}

export interface IPipelineCursor {
  schema?: string;
  active_stage?: string;
  status?: string;
  active_artifacts?: string[];
  active_section?: string;
  active_product?: string;
  progress?: Record<string, string>;
}

export interface IPipelineContext {
  repositoryRoot: string;
  workspaceRoot: string;
  layer: WorkspaceLayer;
  definition: IPipelineDefinition;
  graph: IWorkspaceGraph;
  documents: Record<PipelineArtifact, IPipelineDocument>;
  catalog: IProductCatalog;
  catalogLayer: WorkspaceLayer;
  cursor: IPipelineCursor;
  cursorPath: string;
}

const ENTRY_KINDS: Record<PipelineArtifact, string> = {
  brief: "brief",
  strategy: "strategy",
  brand: "brand",
  design: "design",
  assets: "asset-index",
  products: "products",
};

export const VISUAL_CATEGORIES = [
  "interface-and-website-appearance",
  "typography",
  "photography",
  "illustration",
  "marketing-creative",
] as const;

/** Design sections that a Brief may declare out of scope. */
const DESIGN_FAMILY_SECTIONS: Record<string, string> = {
  "Interface and product surfaces": "interface-and-website-appearance",
  Photography: "photography",
  "Illustration and diagrams": "illustration",
};

const ACCEPTED_INTAKE_STATUSES = new Set(["ready", "out-of-scope"]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function headings(body: string): string[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((match) =>
    canonicalHeading(match[1]),
  );
}

async function readOptional(file: string): Promise<string> {
  return readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
}

function ownSourcePath(
  workspaceRoot: string,
  kind: PipelineArtifact,
  layer: WorkspaceLayer,
): string {
  if (kind === "assets")
    return path.join(workspaceRoot, "assets", `${layer}.yaml`);
  if (kind === "products")
    return path.join(workspaceRoot, "products", layer, "catalog.yaml");
  return path.join(workspaceRoot, kind, `${layer}.md`);
}

async function ownSource(
  file: string,
  kind: PipelineArtifact,
): Promise<{ metadata: Record<string, unknown>; body: string }> {
  const source = await readOptional(file);
  if (!source.trim()) return { metadata: {}, body: "" };
  if (kind === "assets" || kind === "products")
    return { metadata: record(parse(source)), body: "" };
  const parsed = parseDocument(source);
  return { metadata: parsed.metadata, body: parsed.body };
}

export async function loadPipelineContext(options: {
  repositoryRoot: string;
  layer: WorkspaceLayer;
  definition: IPipelineDefinition;
  repositoryIdentity?: string;
}): Promise<IPipelineContext> {
  const { repositoryRoot, layer, definition } = options;
  const workspaceRoot = path.join(repositoryRoot, "apps/studio/workspace");
  const graph = await loadWorkspace({
    activeLayer: layer,
    repositoryIdentity: options.repositoryIdentity,
    repositoryRoot,
  });
  const byKind = new Map<string, ILoadedWorkspaceEntry>(
    graph.loadedEntries.map((entry) => [entry.kind, entry]),
  );
  const documents = {} as Record<PipelineArtifact, IPipelineDocument>;
  for (const kind of Object.keys(ENTRY_KINDS) as PipelineArtifact[]) {
    const entry = byKind.get(ENTRY_KINDS[kind]);
    if (!entry) throw new Error(`Workspace has no ${ENTRY_KINDS[kind]} entry`);
    const format =
      kind === "assets" || kind === "products" ? "yaml" : "markdown";
    const parsed = parseDocument(entry.content, format);
    const file = ownSourcePath(workspaceRoot, kind, layer);
    const own = await ownSource(file, kind);
    documents[kind] = {
      kind,
      resolved: entry.content,
      body: parsed.body,
      metadata: parsed.metadata,
      own: own.metadata,
      ownBody: own.body,
      ownPath: path.relative(workspaceRoot, file),
    };
  }
  const productsEntry = byKind.get("products")!;
  const catalogLayer: WorkspaceLayer = productsEntry.inherited
    ? "singlepage"
    : layer;
  const catalog = parseProductCatalog(productsEntry.content, catalogLayer);
  const cursorPath = path.join(
    repositoryRoot,
    definition.cursor.path.replace("<layer>", layer),
  );
  const cursorSource = await readOptional(cursorPath);
  const cursor = record(cursorSource.trim() ? parse(cursorSource) : {});
  return {
    repositoryRoot,
    workspaceRoot,
    layer,
    definition,
    graph,
    documents,
    catalog,
    catalogLayer,
    cursor: {
      active_section:
        typeof cursor.active_section === "string"
          ? cursor.active_section
          : undefined,
      active_product:
        typeof cursor.active_product === "string"
          ? cursor.active_product
          : undefined,
      progress: record(cursor.progress) as Record<string, string>,
      schema: typeof cursor.schema === "string" ? cursor.schema : undefined,
      active_stage:
        typeof cursor.active_stage === "string"
          ? cursor.active_stage
          : undefined,
      status: typeof cursor.status === "string" ? cursor.status : undefined,
      active_artifacts: Array.isArray(cursor.active_artifacts)
        ? cursor.active_artifacts.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      blockers: Array.isArray(cursor.blockers)
        ? cursor.blockers.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    },
    cursorPath: path.relative(repositoryRoot, cursorPath),
  };
}

function result(
  check: IPipelineCheck,
  status: CheckStatus,
  detail: string,
  extra: { classification?: GapClassification; items?: string[] } = {},
): ICheckResult {
  return {
    id: check.id,
    check: check.check,
    artifact: check.artifact,
    status,
    detail,
    ...(status === "gap"
      ? { classification: extra.classification ?? "structural-gap" }
      : {}),
    ...(extra.items?.length ? { items: extra.items } : {}),
  };
}

function compareSections(
  check: IPipelineCheck,
  document: IPipelineDocument,
  required: string[],
  label: string,
  layer: WorkspaceLayer,
): ICheckResult {
  const actual = headings(document.body);
  const ownHeadings = new Set(headings(document.ownBody));
  const missing = required.filter((section) => !actual.includes(section));
  // A layer adds the sections its business needs. Only a section that appears
  // without any layer owning it signals template drift rather than a decision.
  const extra = actual.filter(
    (section) =>
      !required.includes(section) &&
      !(layer === "startup" && document.ownBody && ownHeadings.has(section)),
  );
  if (!missing.length && !extra.length)
    return result(
      check,
      "pass",
      `${label} carries the ${required.length} template sections`,
    );
  return result(check, "gap", `${label} differs from the template sections`, {
    items: [
      ...missing.map((section) => `missing: ${section}`),
      ...extra.map((section) =>
        layer === "startup" && document.ownBody && !ownHeadings.has(section)
          ? `unexpected: ${section} (inherited from singlepage; a startup section can replace a base section but not remove it)`
          : `unexpected: ${section}`,
      ),
    ],
  });
}

async function productFileSections(
  context: IPipelineContext,
  check: IPipelineCheck,
  field: "product",
  label: string,
): Promise<ICheckResult> {
  const items: string[] = [];
  for (const product of context.catalog.products) {
    const source = product[field];
    if (!source) {
      items.push(`${product.id}: no ${field} source declared`);
      continue;
    }
    const file = path.join(
      context.workspaceRoot,
      "products",
      context.catalogLayer,
      source,
    );
    const text = await readOptional(file);
    if (!text) {
      items.push(`${product.id}: ${source} is missing`);
      continue;
    }
    if (!hasMarkdownContent(parseDocument(text).body))
      items.push(`${product.id}: ${source} has no product description`);
  }
  if (!context.catalog.products.length)
    return result(check, "skipped", "the catalog has no products yet");
  return items.length
    ? result(check, "gap", `${label} documents need content corrections`, {
        items,
      })
    : result(
        check,
        "pass",
        `${label} of ${context.catalog.products.length} product(s) contains a description`,
      );
}

/**
 * The framework names a section once. A layer that translates or drops an
 * inherited heading splits one section into two, so an inherited name is used
 * exactly and extra sections sit beside it.
 */
async function frameworkHeadings(
  context: IPipelineContext,
  check: IPipelineCheck,
): Promise<ICheckResult> {
  if (context.layer === "singlepage")
    return result(check, "skipped", "the framework layer declares the names");
  const document = context.documents[check.artifact];
  const findings = findTranslatedHeadings({
    framework: await readOptional(
      ownSourcePath(context.workspaceRoot, check.artifact, "singlepage"),
    ),
    project: await readOptional(
      ownSourcePath(context.workspaceRoot, check.artifact, context.layer),
    ),
    projectPath: document.ownPath,
  });
  return findings.length
    ? result(check, "gap", `${check.artifact} renamed an inherited heading`, {
        items: findings.map(({ detail }) => detail),
      })
    : result(
        check,
        "pass",
        `${check.artifact} spells every inherited heading as the framework does`,
      );
}

/**
 * The commit hook formats Markdown, so a stamp taken before formatting covers a
 * body that stops existing at the next commit. Format first, then read the
 * fingerprint.
 */
async function documentsFormatted(
  context: IPipelineContext,
  check: IPipelineCheck,
): Promise<ICheckResult> {
  const file = ownSourcePath(
    context.workspaceRoot,
    check.artifact,
    context.layer,
  );
  const findings = await findUnformattedDocuments([
    {
      path: file,
      source: await readOptional(file),
    },
  ]);
  return findings.length
    ? result(check, "gap", `${check.artifact} is not in its committed form`, {
        items: findings.map(({ detail }) => detail),
      })
    : result(check, "pass", `${check.artifact} is already formatted`);
}

/**
 * A document states what is in force. The revision that produced a statement,
 * the alternative it replaced and the date a review happened live in Git and in
 * the attribution beside the statement, so the body carries none of them.
 */
function noChangeLog(
  context: IPipelineContext,
  check: IPipelineCheck,
): ICheckResult {
  const document = context.documents[check.artifact];
  const findings = findChangeLogShapes(document.ownBody);
  return findings.length
    ? result(check, "gap", `${check.artifact} body carries a change log`, {
        items: findings.map(
          ({ line, match, detail }) =>
            `${document.ownPath}:${line} \u00b7 "${match}" \u2014 ${detail}`,
        ),
      })
    : result(
        check,
        "pass",
        `${check.artifact} states what is in force without a change log`,
      );
}

async function generatedAssetsRegistered(
  context: IPipelineContext,
  check: IPipelineCheck,
): Promise<ICheckResult> {
  const registry = record(context.documents.assets.own);
  const entries = Array.isArray(registry.assets)
    ? registry.assets.map(record)
    : [];
  const proposalId = context.documents.design.own.proposal_id;
  const items: string[] = [];
  const registeredPaths = new Set<string>();
  // A set produced in one pass covers the files below it in the next.
  const registeredDirectories: string[] = [];
  for (const entry of entries) {
    if (entry.source_type !== "generated") continue;
    const id = typeof entry.id === "string" ? entry.id : "<no id>";
    const file = typeof entry.path === "string" ? entry.path : "";
    registeredPaths.add(file);
    if (entry.lifecycle !== "proposed" && entry.lifecycle !== "approved")
      items.push(`${id}: lifecycle must be proposed or approved`);
    if (typeof proposalId === "string" && entry.proposal_id !== proposalId)
      items.push(
        `${id}: proposal_id ${String(entry.proposal_id)} is not the current ${proposalId}`,
      );
    if (!file.startsWith(`assets/${context.layer}/generated/`)) {
      items.push(
        `${id}: path must be below assets/${context.layer}/generated/`,
      );
      continue;
    }
    const absolute = path.join(context.workspaceRoot, file);
    if (!existsSync(absolute)) {
      items.push(`${id}: file ${file} does not exist`);
      continue;
    }
    if (!(await stat(absolute)).isDirectory()) continue;
    registeredDirectories.push(`${file.replace(/\/+$/, "")}/`);
    if (!(await readdir(absolute)).length)
      items.push(`${id}: directory ${file} registers no files`);
  }
  const generatedRoot = path.join(
    context.workspaceRoot,
    "assets",
    context.layer,
    "generated",
  );
  const orphans: string[] = [];
  async function walk(directory: string) {
    for (const name of await readdir(directory).catch(() => [] as string[])) {
      const file = path.join(directory, name);
      const info = await stat(file);
      if (info.isDirectory()) await walk(file);
      else {
        const relative = path
          .relative(context.workspaceRoot, file)
          .split(path.sep)
          .join("/");
        if (
          !registeredPaths.has(relative) &&
          !registeredDirectories.some((prefix) => relative.startsWith(prefix))
        )
          orphans.push(relative);
      }
    }
  }
  await walk(generatedRoot);
  items.push(...orphans.map((file) => `orphan generated file: ${file}`));
  const generatedCount = entries.filter(
    (entry) => entry.source_type === "generated",
  ).length;
  if (!generatedCount && !orphans.length)
    return result(
      check,
      "skipped",
      `no generated assets are registered in the ${context.layer} layer`,
    );
  return items.length
    ? result(check, "gap", "generated assets and the registry disagree", {
        items,
      })
    : result(
        check,
        "pass",
        `${generatedCount} generated asset(s) registered with existing files`,
      );
}

function registryIds(context: IPipelineContext): Set<string> {
  const resolved = record(parse(context.documents.assets.resolved));
  const entries = Array.isArray(resolved.assets)
    ? resolved.assets.map(record)
    : [];
  return new Set(
    entries
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === "string"),
  );
}

function sectionBlock(body: string, heading: string, level: 2 | 3): string {
  body = canonicalMarkdownHeadings(body);
  const marker = level === 2 ? "## " : "### ";
  const start = body.indexOf(`\n${marker}${heading}`);
  const from =
    start >= 0 ? start + 1 : body.startsWith(`${marker}${heading}`) ? 0 : -1;
  if (from < 0) return "";
  const rest = body.slice(from + marker.length + heading.length);
  const stop = rest.search(level === 2 ? /^## /m : /^##{1,2} /m);
  return stop >= 0 ? rest.slice(0, stop) : rest;
}

function mediaExamples(
  context: IPipelineContext,
  check: IPipelineCheck,
): ICheckResult {
  const body = context.documents.design.body;
  const ids = registryIds(context);
  const items: string[] = [];
  let families = 0;
  for (const family of ["Photography", "Illustration and diagrams"]) {
    const block = sectionBlock(body, family, 2);
    if (!block) continue;
    families += 1;
    const examples = sectionBlock(block, "Generation examples", 3);
    const rows = examples
      .split("\n")
      .filter((line) => line.trim().startsWith("|"))
      .slice(2);
    const referenced = rows
      .map((row) => row.match(/`([^`]+)`\s*\|\s*$/)?.[1])
      .filter((id): id is string => Boolean(id));
    if (rows.length < 3)
      items.push(
        `${family}: ${rows.length} generation example(s), at least three are required`,
      );
    for (const id of referenced)
      if (!ids.has(id))
        items.push(`${family}: example asset ${id} is not registered`);
    if (rows.length && referenced.length < rows.length)
      items.push(
        `${family}: ${rows.length - referenced.length} example(s) without an asset ID`,
      );
  }
  if (!families)
    return result(
      check,
      "skipped",
      "Design has no photography or illustration section",
    );
  return items.length
    ? result(
        check,
        "gap",
        "media families lack reviewed, registered examples",
        { items },
      )
    : result(
        check,
        "pass",
        `${families} media famil${families === 1 ? "y has" : "ies have"} at least three registered examples`,
      );
}

async function runCheck(
  context: IPipelineContext,
  check: IPipelineCheck,
): Promise<ICheckResult> {
  const document = context.documents[check.artifact];
  switch (check.check) {
    case "sections":
      return compareSections(
        check,
        document,
        templateSections(context.repositoryRoot, check.template!),
        check.artifact,
        context.layer,
      );
    case "frontmatter": {
      const missing = (check.keys ?? []).filter((key) => {
        let value: unknown = document.metadata;
        for (const part of key.split(".")) value = record(value)[part];
        return value === undefined;
      });
      return missing.length
        ? result(
            check,
            "gap",
            `${check.artifact} frontmatter lacks required keys`,
            { items: missing },
          )
        : result(
            check,
            "pass",
            `${check.artifact} frontmatter declares ${(check.keys ?? []).join(", ")}`,
          );
    }
    case "no-change-log":
      return noChangeLog(context, check);
    case "framework-headings":
      return frameworkHeadings(context, check);
    case "documents-formatted":
      return documentsFormatted(context, check);
    case "product-sections":
      return productFileSections(context, check, "product", "Product");
    case "sales-v2":
    case "sales-readiness": {
      const items: string[] = [];
      for (const product of context.catalog.products) {
        const text = await readOptional(
          path.join(
            context.workspaceRoot,
            "products",
            context.catalogLayer,
            product.sales,
          ),
        );
        if (!text) {
          items.push(`${product.id}: ${product.sales} is missing`);
          continue;
        }
        try {
          const sales = parseSalesProcess(text, product.id);
          if (check.check === "sales-v2" && !sales.schema.endsWith(".v2"))
            items.push(`${product.id}: sales uses ${sales.schema}`);
          if (check.check === "sales-readiness" && sales.readiness !== "ready")
            items.push(
              `${product.id}: readiness ${sales.readiness}${sales.blockers.length ? ` (${sales.blockers.join("; ")})` : ""}`,
            );
        } catch (error) {
          items.push(
            `${product.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      if (!context.catalog.products.length)
        return result(check, "skipped", "the catalog has no products yet");
      if (!items.length)
        return result(
          check,
          "pass",
          check.check === "sales-v2"
            ? "every product sales process uses the v2 schema"
            : "every product sales process is ready",
        );
      return result(
        check,
        "gap",
        check.check === "sales-v2"
          ? "sales processes need the v2 schema"
          : "sales processes still carry business blockers",
        {
          classification:
            check.check === "sales-readiness"
              ? "decision-gap"
              : "structural-gap",
          items,
        },
      );
    }
    case "visual-intake-ready": {
      const references = record(document.own.visual_references);
      const items = VISUAL_CATEGORIES.filter((category) => {
        const status = record(references[category]).status;
        return (
          typeof status !== "string" || !ACCEPTED_INTAKE_STATUSES.has(status)
        );
      }).map((category) => {
        const status = record(references[category]).status;
        return `${category}: ${typeof status === "string" ? status : "not recorded in " + document.ownPath}`;
      });
      return items.length
        ? result(
            check,
            "gap",
            "visual reference intake is not ready in every category",
            { classification: "decision-gap", items },
          )
        : result(
            check,
            "pass",
            "all five visual reference categories are ready or explicitly out of scope",
          );
    }
    case "design-sections": {
      const references = record(context.documents.brief.own.visual_references);
      const required = templateSections(
        context.repositoryRoot,
        check.template!,
      ).filter((section) => {
        const category = DESIGN_FAMILY_SECTIONS[section];
        return (
          !category || record(references[category]).status !== "out-of-scope"
        );
      });
      return compareSections(
        check,
        document,
        required,
        "design",
        context.layer,
      );
    }
    case "generated-assets-registered":
      return generatedAssetsRegistered(context, check);
    case "media-examples":
      return mediaExamples(context, check);
    case "brandbook-owned": {
      const findings = await findUnownedBrandbook(
        context.workspaceRoot,
        context.layer,
      );
      return findings.length
        ? result(check, "gap", "the project does not own its brandbook", {
            classification: "structural-gap",
            items: findings.map(
              ({ requirement, detail }) => `${requirement}: ${detail}`,
            ),
          })
        : result(
            check,
            "pass",
            context.layer === "startup"
              ? "the startup layer owns its Design and assets"
              : "not applicable to the framework layer",
          );
    }
    case "specimen-catalogue": {
      const findings = await findSpecimenDeviations(context.workspaceRoot);
      return findings.length
        ? result(check, "gap", "the project renamed or invented a wrapper", {
            items: findings.map(
              ({ requirement, detail }) => `${requirement}: ${detail}`,
            ),
          })
        : result(
            check,
            "pass",
            "every section and specimen keeps the name the framework gives it",
          );
    }
    case "specimens-rendered": {
      const findings = await findMissingSpecimens(context.workspaceRoot);
      return findings.length
        ? result(
            check,
            "gap",
            "documented interface rules lack rendered specimens",
            {
              items: findings.map(({ requirement }) => requirement),
            },
          )
        : result(
            check,
            "pass",
            "every documented interface specimen renders or is explicitly omitted",
          );
    }
    case "catalog-structure": {
      const layerRoot = path.join(
        context.workspaceRoot,
        "products",
        context.catalogLayer,
      );
      try {
        await validateProductCatalogFiles(context.catalog, layerRoot);
        await validateProductSectionFiles(context.catalog, layerRoot);
        return result(
          check,
          "pass",
          `catalog files, sections, sales segments and finding IDs validate for ${context.catalog.products.length} product(s)`,
        );
      } catch (error) {
        return result(
          check,
          "gap",
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}

export async function runStageChecks(
  context: IPipelineContext,
  checks: IPipelineCheck[],
): Promise<ICheckResult[]> {
  const results: ICheckResult[] = [];
  for (const check of checks) {
    try {
      results.push(await runCheck(context, check));
    } catch (error) {
      results.push(
        result(
          check,
          "gap",
          `check could not run: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
  return results;
}

async function workspaceTextFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function walk(directory: string) {
    for (const name of await readdir(directory).catch(() => [] as string[])) {
      if (name === "utils" || name === "node_modules" || name.startsWith("."))
        continue;
      const file = path.join(directory, name);
      const info = await stat(file);
      if (info.isDirectory()) await walk(file);
      else if (/\.(md|ya?ml)$/.test(name)) files.push(file);
    }
  }
  await walk(root);
  return files;
}
