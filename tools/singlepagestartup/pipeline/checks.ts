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
import { findMissingSpecimens } from "../../studio/design/specimens";
import {
  validateProductCatalogFiles,
  validateProductSectionFiles,
} from "../../studio/products/validate";
import {
  parseDocument,
  type IDocumentConfirmation,
} from "../../studio/workspace/document";
import {
  loadWorkspace,
  type ILoadedWorkspaceEntry,
  type IWorkspaceGraph,
  type WorkspaceLayer,
} from "../../studio/workspace/loader";
import type { IDocumentReview } from "../../studio/workspace/review";
import { loadDocumentReviews } from "../../studio/workspace/review-loader";
import {
  templateSections,
  type IPipelineCheck,
  type IPipelineDefinition,
  type IPipelineLegacyShape,
  type PipelineArtifact,
} from "./definition";

export type CheckStatus = "pass" | "gap" | "skipped";
export type GapClassification =
  | "structural-gap"
  | "approval-gap"
  | "decision-gap";

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

export interface ILegacyShapeResult {
  id: string;
  procedure: string;
  owning_stage: string;
  detail: string;
  items: string[];
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
  review?: IDocumentReview;
}

export interface IPipelineCursor {
  schema?: string;
  active_stage?: string;
  status?: string;
  active_artifacts?: string[];
  blockers?: string[];
}

export interface IPipelineContext {
  repositoryRoot: string;
  workspaceRoot: string;
  layer: WorkspaceLayer;
  definition: IPipelineDefinition;
  graph: IWorkspaceGraph;
  reviews: Map<string, IDocumentReview>;
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

const REVIEW_IDS: Record<PipelineArtifact, string> = {
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
  return [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
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
  const reviews = await loadDocumentReviews(workspaceRoot, layer);
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
      review: reviews.get(REVIEW_IDS[kind]),
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
    reviews,
    documents,
    catalog,
    catalogLayer,
    cursor: {
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
  const extra = actual.filter((section) => !required.includes(section));
  if (!missing.length && !extra.length)
    return result(
      check,
      "pass",
      `${label} uses the ${required.length} template sections`,
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
  field: "product" | "research" | "analytics",
  label: string,
): Promise<ICheckResult> {
  const required = templateSections(context.repositoryRoot, check.template!);
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
    const actual = headings(parseDocument(text).body);
    for (const section of required)
      if (!actual.includes(section))
        items.push(`${product.id}: missing ${section}`);
    for (const section of actual)
      if (!required.includes(section))
        items.push(`${product.id}: unexpected ${section}`);
  }
  if (!context.catalog.products.length)
    return result(check, "skipped", "the catalog has no products yet");
  return items.length
    ? result(check, "gap", `${label} sections differ from the template`, {
        items,
      })
    : result(
        check,
        "pass",
        `${label} of ${context.catalog.products.length} product(s) use the template sections`,
      );
}

function confirmedInLayer(
  context: IPipelineContext,
  check: IPipelineCheck,
): ICheckResult {
  const document = context.documents[check.artifact];
  const review = document.review;
  if (!review)
    return result(check, "gap", "no review record exists for this document");
  const { state, layer, reason, sources, underlying } = review.confirmation;
  if (state === "confirmed" && layer === context.layer)
    return result(check, "pass", `confirmed in the ${layer} layer`);
  const detail =
    state === "confirmed"
      ? `confirmed only in the ${layer} layer; the ${context.layer} project needs its own confirmation`
      : `state is ${describeState(state, underlying)}${reason ? `: ${reason}` : ""}`;
  return result(check, "gap", detail, {
    classification: "approval-gap",
    items: sources ?? [],
  });
}

/**
 * Stale hides the document's own state, so a body that left its stamp behind
 * reads as an input problem. Name both.
 */
function describeState(
  state: IDocumentConfirmation["state"],
  underlying: IDocumentConfirmation["underlying"],
): string {
  return underlying && underlying !== "unconfirmed"
    ? `${state} over ${underlying}`
    : state;
}

/**
 * A confirmation stamp covers the body it was recorded against. Once that body
 * changes the stamp stops meaning anything, whether or not upstream inputs
 * also moved; a document that carries no stamp has nothing to invalidate.
 */
function stampCurrent(
  context: IPipelineContext,
  check: IPipelineCheck,
): ICheckResult {
  const review = context.documents[check.artifact].review;
  if (!review)
    return result(
      check,
      "skipped",
      "no review record exists for this document",
    );
  const { state, underlying } = review.confirmation;
  const own = state === "stale" ? underlying : state;
  if (own !== "changed")
    return result(
      check,
      "pass",
      own === "unconfirmed" || own === undefined
        ? "no confirmation stamp to invalidate"
        : "the recorded confirmation covers the current body",
    );
  return result(
    check,
    "gap",
    "the recorded confirmation no longer covers the current body; confirm the body as it stands or restore what was approved",
    { classification: "approval-gap" },
  );
}

function scopeProducts(context: IPipelineContext): string[] | undefined {
  const scope = record(record(context.documents.brief.own.intake).scope);
  if (scope.confirmed !== true || !Array.isArray(scope.products))
    return undefined;
  const products = scope.products.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  return products.length ? products : undefined;
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
    case "brief-scope": {
      const products = scopeProducts(context);
      if (products)
        return result(
          check,
          "pass",
          `scope confirmed in ${document.ownPath} for ${products.join(", ")}`,
        );
      return result(
        check,
        "gap",
        `${document.ownPath} has no confirmed intake.scope with products; an inherited scope never satisfies this gate`,
        { classification: "approval-gap" },
      );
    }
    case "confirmed":
      return confirmedInLayer(context, check);
    case "stamp-current":
      return stampCurrent(context, check);
    case "catalog-matches-brief": {
      const products = scopeProducts(context);
      if (!products)
        return result(
          check,
          "skipped",
          "no confirmed scope to compare with the catalog",
        );
      const catalogIds = context.catalog.products.map((product) => product.id);
      const items = [
        ...products
          .filter((id) => !catalogIds.includes(id))
          .map((id) => `confirmed product without catalog entry: ${id}`),
        ...catalogIds
          .filter((id) => !products.includes(id))
          .map((id) => `catalog product outside the confirmed scope: ${id}`),
      ];
      return items.length
        ? result(
            check,
            "gap",
            "the catalog and the confirmed Brief scope disagree",
            { items },
          )
        : result(
            check,
            "pass",
            `catalog matches the ${products.length} confirmed product(s)`,
          );
    }
    case "model-sections": {
      const required = templateSections(
        context.repositoryRoot,
        check.template!,
      );
      const items: string[] = [];
      for (const model of context.catalog.models) {
        const text = await readOptional(
          path.join(
            context.workspaceRoot,
            "products",
            context.catalogLayer,
            model.source,
          ),
        );
        if (!text) {
          items.push(`${model.id}: ${model.source} is missing`);
          continue;
        }
        const actual = headings(parseDocument(text).body);
        for (const section of required)
          if (!actual.includes(section))
            items.push(`${model.id}: missing ${section}`);
        for (const section of actual)
          if (!required.includes(section))
            items.push(`${model.id}: unexpected ${section}`);
      }
      if (!context.catalog.models.length)
        return result(
          check,
          "skipped",
          "the catalog declares no model, which is the ordinary shape: a product owns its own economics",
        );
      return items.length
        ? result(check, "gap", "model sections differ from the template", {
            items,
          })
        : result(
            check,
            "pass",
            `${context.catalog.models.length} model(s) use the template sections`,
          );
    }
    case "product-sections":
      return productFileSections(context, check, "product", "Product");
    case "research-sections":
      return productFileSections(context, check, "research", "Research");
    case "research-finding-prefix": {
      const items: string[] = [];
      const seen = new Map<string, string>();
      for (const product of context.catalog.products) {
        const text = await readOptional(
          path.join(
            context.workspaceRoot,
            "products",
            context.catalogLayer,
            product.research,
          ),
        );
        const prefix = text
          ? parseDocument(text).metadata.finding_prefix
          : undefined;
        if (typeof prefix !== "string" || !/^[A-Z][A-Z0-9]*$/.test(prefix)) {
          items.push(
            `${product.id}: finding_prefix must be uppercase letters and digits`,
          );
          continue;
        }
        if (seen.has(prefix))
          items.push(
            `${product.id}: finding_prefix ${prefix} is already used by ${seen.get(prefix)}`,
          );
        seen.set(prefix, product.id);
      }
      if (!context.catalog.products.length)
        return result(check, "skipped", "the catalog has no products yet");
      return items.length
        ? result(
            check,
            "gap",
            "research finding prefixes are missing or ambiguous",
            { items },
          )
        : result(
            check,
            "pass",
            "every product research declares a unique finding prefix",
          );
    }
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
            classification: "approval-gap",
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
    case "analytics-declared": {
      const required = templateSections(
        context.repositoryRoot,
        check.template!,
      );
      const items: string[] = [];
      for (const product of context.catalog.products) {
        if (!product.analytics) {
          items.push(`${product.id}: no analytics source declared`);
          continue;
        }
        const text = await readOptional(
          path.join(
            context.workspaceRoot,
            "products",
            context.catalogLayer,
            product.analytics,
          ),
        );
        if (!text) {
          items.push(`${product.id}: ${product.analytics} is missing`);
          continue;
        }
        const actual = headings(parseDocument(text).body);
        for (const section of required)
          if (!actual.includes(section))
            items.push(`${product.id}: missing ${section}`);
      }
      if (!context.catalog.products.length)
        return result(check, "skipped", "the catalog has no products yet");
      return items.length
        ? result(check, "gap", "analytics sources are missing or incomplete", {
            items,
          })
        : result(
            check,
            "pass",
            "every product declares a complete Analytics source",
          );
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

export async function detectLegacyShapes(
  context: IPipelineContext,
  shapes: IPipelineLegacyShape[],
): Promise<ILegacyShapeResult[]> {
  const found: ILegacyShapeResult[] = [];
  for (const shape of shapes) {
    const items: string[] = [];
    switch (shape.detect) {
      case "decision-profile":
        for (const layer of ["singlepage", "startup"]) {
          const file = path.join(
            context.workspaceRoot,
            "knowledge",
            "decision-profile",
            `${layer}.md`,
          );
          if (existsSync(file))
            items.push(path.relative(context.workspaceRoot, file));
        }
        break;
      case "standalone-business":
        for (const layer of ["singlepage", "startup"]) {
          const file = path.join(
            context.workspaceRoot,
            "business",
            `${layer}.md`,
          );
          if (existsSync(file))
            items.push(path.relative(context.workspaceRoot, file));
        }
        for (const entry of context.graph.visibleEntries)
          if (entry.kind === "business") items.push(`index entry ${entry.id}`);
        break;
      case "catalog-v1":
        for (const layer of ["singlepage", "startup"] as const) {
          const text = await readOptional(
            path.join(context.workspaceRoot, "products", layer, "catalog.yaml"),
          );
          if (
            text &&
            record(parse(text)).schema ===
              "singlepagestartup.product-catalog.v1"
          )
            items.push(`products/${layer}/catalog.yaml`);
        }
        break;
      case "sales-v1":
        for (const product of context.catalog.products) {
          const text = await readOptional(
            path.join(
              context.workspaceRoot,
              "products",
              context.catalogLayer,
              product.sales,
            ),
          );
          if (
            text &&
            record(parse(text)).schema === "singlepagestartup.sales-process.v1"
          )
            items.push(`${product.id}: ${product.sales}`);
        }
        break;
      case "evidence-register-codes":
        for (const file of await workspaceTextFiles(context.workspaceRoot)) {
          const text = await readFile(file, "utf8");
          if (/\b(?:ST|SP)-EV-\d+/.test(text))
            items.push(path.relative(context.workspaceRoot, file));
        }
        break;
      case "legacy-cursor-anchors":
        for (const blocker of context.cursor.blockers ?? [])
          if (
            /#(?:decision-status|commercial-choice|first-experiment)\b/.test(
              blocker,
            )
          )
            items.push(`blocker ${blocker}`);
        for (const artifact of context.cursor.active_artifacts ?? [])
          if (["business", "decision-profile", "evidence"].includes(artifact))
            items.push(`active artifact ${artifact}`);
        break;
    }
    if (items.length)
      found.push({
        id: shape.id,
        procedure: shape.procedure,
        owning_stage: shape.owning_stage,
        detail: `legacy shape detected; follow ${shape.procedure}`,
        items,
      });
  }
  return found;
}
