import { parse } from "yaml";
import {
  documentConfirmation,
  documentFingerprint,
  parseDocument,
  type DocumentLayer,
  type IDocumentConfirmation,
} from "./document";
import { mergeWorkspaceContent, type WorkspaceMergeStrategy } from "./merge";

export interface IReviewIndexEntry {
  id: string;
  kind: string;
  path: string;
  uses: string[];
  extends?: string;
  strategy?: WorkspaceMergeStrategy;
}

export interface IReviewDocument {
  id: string;
  source: string;
  path: string;
  layer: DocumentLayer;
  format: "markdown" | "yaml";
  uses: string[];
  /** Hypotheses inspected as source text, without inheriting their approval state. */
  observes?: string[];
}

export interface IDocumentReview {
  document: IReviewDocument;
  confirmation: IDocumentConfirmation;
  dependencies: Record<string, string>;
}

/** Registered extension documents keep the same nested IDs and layer as their product. */
export function productReviewPages(
  product: Record<string, unknown>,
): Array<{ id: string; source: string; owner: string; uses?: string[] }> {
  const result: Array<{
    id: string;
    source: string;
    owner: string;
    uses?: string[];
  }> = [];
  for (const section of (product.sections ?? []) as Array<{
    id: string;
    pages: Array<{
      id: string;
      source?: string;
      representations?: { text: string; preview?: string };
      uses?: string[];
      children?: unknown[];
    }>;
  }>) {
    const visit = (pages: typeof section.pages) => {
      for (const page of pages) {
        const source = page.representations?.text ?? page.source;
        if (source?.endsWith(".md"))
          result.push({
            id: `product.${product.id}.page.${section.id}.${page.id}`,
            source,
            owner: section.id,
            ...(page.uses?.length ? { uses: page.uses } : {}),
          });
        if (page.children) visit(page.children as typeof section.pages);
      }
    };
    visit(section.pages);
  }
  return result;
}

export function reviewId(id: string): string {
  return id.replace(/^(singlepage|startup)\./, "");
}

export function workspaceRelativePath(value: string): string {
  return value.replace(/^apps\/studio\/workspace\//, "").replace(/^\.\//, "");
}

/** Shared by the browser and agent loader; no filesystem or Git access. */
export function resolveDocumentReviews(
  documents: IReviewDocument[],
): Map<string, IDocumentReview> {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const result = new Map<string, IDocumentReview>();
  const visiting = new Set<string>();
  function resolve(id: string): IDocumentReview {
    const previous = result.get(id);
    if (previous) return previous;
    if (visiting.has(id))
      throw new Error(`Document review dependency cycle: ${id}`);
    const document = byId.get(id)!;
    visiting.add(id);
    let confirmation = documentConfirmation(
      document.source,
      document.layer,
      document.format,
    );
    const metadata = parseDocument(document.source, document.format).metadata;
    const review = metadata.review as
      | { dependencies?: Record<string, string> }
      | undefined;
    const dependencies: Record<string, string> = {};
    const affected = new Set<string>();
    for (const dependencyId of [
      ...new Set([...document.uses, ...(document.observes ?? [])]),
    ].sort()) {
      const dependency = byId.get(dependencyId);
      if (!dependency) {
        affected.add(dependencyId);
        continue;
      }
      dependencies[dependencyId] = documentFingerprint(
        dependency.source,
        dependency.format,
      );
      if (
        document.uses.includes(dependencyId) &&
        resolve(dependencyId).confirmation.state === "stale"
      )
        affected.add(dependencyId);
      if (
        (review?.dependencies || confirmation.confirmed) &&
        review?.dependencies?.[dependencyId] !== dependencies[dependencyId]
      )
        affected.add(dependencyId);
    }
    for (const oldDependency of Object.keys(review?.dependencies ?? {})) {
      if (!Object.hasOwn(dependencies, oldDependency))
        affected.add(oldDependency);
    }
    if (affected.size && confirmation.state !== "stale") {
      confirmation = {
        ...confirmation,
        confirmed: false,
        state: "stale",
        underlying: confirmation.state,
        reason:
          "Upstream inputs changed or have not been reviewed. Check their impact before using this document.",
        sources: [...affected].sort(),
      };
    }
    const resolved = { document, confirmation, dependencies };
    result.set(id, resolved);
    visiting.delete(id);
    return resolved;
  }
  documents.forEach(({ id }) => resolve(id));
  return result;
}

/** Catalog entries own product files; the index remains the shared dependency registry. */
export function workspaceReviewDocuments({
  indexes,
  sources,
  layer,
}: {
  indexes: Record<DocumentLayer, { entries: IReviewIndexEntry[] }>;
  sources: Record<string, string>;
  layer: DocumentLayer;
}): IReviewDocument[] {
  const baseEntries = indexes.singlepage.entries.filter(
    (entry) =>
      !entry.path.startsWith(".agents/") && /\.(md|yaml)$/.test(entry.path),
  );
  const aliases = new Map(
    indexes.singlepage.entries.map((entry) => [entry.id, reviewId(entry.id)]),
  );
  for (const entry of indexes.startup.entries)
    aliases.set(entry.id, reviewId(entry.extends ?? entry.id));
  const documents = baseEntries.map((base): IReviewDocument => {
    const overlay =
      layer === "startup"
        ? indexes.startup.entries.find((entry) => entry.extends === base.id)
        : undefined;
    const basePath = workspaceRelativePath(base.path);
    const overlayPath = overlay
      ? workspaceRelativePath(overlay.path)
      : undefined;
    if (!Object.hasOwn(sources, basePath))
      throw new Error(`Missing review source: ${basePath}`);
    if (overlayPath && !Object.hasOwn(sources, overlayPath))
      throw new Error(`Missing review source: ${overlayPath}`);
    const merged = overlay
      ? mergeWorkspaceContent({
          base: sources[basePath],
          overlay: sources[overlayPath!],
          kind: base.kind,
          sourcePath: overlayPath!,
          strategy: overlay.strategy,
        })
      : undefined;
    return {
      id: reviewId(base.id),
      source: merged?.content ?? sources[basePath],
      path: merged?.overlayContributes ? overlayPath! : basePath,
      layer:
        merged?.confirmationLayer ??
        (merged?.overlayContributes ? "startup" : "singlepage"),
      format: basePath.endsWith(".yaml") ? "yaml" : "markdown",
      uses: [
        ...new Set(
          [...base.uses, ...(overlay?.uses ?? [])]
            .filter(
              (id) => !id.startsWith("template.") && !id.startsWith("role."),
            )
            .map((id) => aliases.get(id) ?? reviewId(id)),
        ),
      ],
    };
  });
  if (layer === "startup") {
    for (const entry of indexes.startup.entries.filter(
      (entry) =>
        !entry.extends &&
        !entry.path.startsWith(".agents/") &&
        /\.(md|yaml)$/.test(entry.path),
    )) {
      const sourcePath = workspaceRelativePath(entry.path);
      if (!Object.hasOwn(sources, sourcePath))
        throw new Error(`Missing review source: ${sourcePath}`);
      documents.push({
        id: reviewId(entry.id),
        path: sourcePath,
        source: sources[sourcePath],
        layer: "startup",
        format: sourcePath.endsWith(".yaml") ? "yaml" : "markdown",
        uses: entry.uses
          .filter(
            (id) => !id.startsWith("template.") && !id.startsWith("role."),
          )
          .map((id) => aliases.get(id) ?? reviewId(id)),
      });
    }
  }
  const catalog = documents.find(({ id }) => id === "products");
  const products =
    (
      parse(catalog?.source ?? "") as {
        products?: Array<Record<string, string>>;
      } | null
    )?.products ?? [];
  const catalogLayer = catalog?.layer ?? layer;
  const models =
    (
      parse(catalog?.source ?? "") as {
        models?: Array<{ id: string; source: string; uses?: string[] }>;
      } | null
    )?.models ?? [];
  for (const model of models) {
    const sourcePath = `products/${catalogLayer}/${model.source}`;
    if (!Object.hasOwn(sources, sourcePath))
      throw new Error(`Missing review source: ${sourcePath}`);
    documents.push({
      id: `model.${model.id}`,
      path: sourcePath,
      source: sources[sourcePath],
      layer: catalogLayer,
      format: "markdown",
      uses: ["brief", ...(model.uses ?? []).map((id) => `model.${id}`)].filter(
        (id) =>
          id.startsWith("model.") ||
          documents.some((document) => document.id === id),
      ),
    });
    documents
      .find(({ id }) => id === "strategy")
      ?.uses.push(`model.${model.id}`);
  }
  const productFields = {
    analytics: "analytics",
    research: "research",
    sales: "sales",
    product: "product",
    website: "website",
    creative: "marketing_creative",
    presentation: "presentation_data",
    "presentation-renderer": "presentation",
  } as const;
  const inputRules = {
    analytics: ["$product", "$sales"],
    research: ["brief"],
    sales: ["$product"],
    product: ["brief", "$research"],
    website: ["$product", "$sales", "strategy", "brand", "design"],
    creative: ["$product", "$sales", "$website", "brand", "design"],
    presentation: [
      "$product",
      "$research",
      "$sales",
      "brand",
      "design",
      "$presentation-renderer",
    ],
    "presentation-renderer": [],
  };
  for (const product of products) {
    for (const [kind, field] of Object.entries(productFields)) {
      if (!product[field]) continue;
      const sourcePath = `products/${catalogLayer}/${product[field]}`;
      if (!Object.hasOwn(sources, sourcePath))
        throw new Error(`Missing review source: ${sourcePath}`);
      const id = `product.${product.id}.${kind}`;
      documents.push({
        id,
        path: sourcePath,
        source: sources[sourcePath],
        layer: catalogLayer,
        format: sourcePath.endsWith(".yaml") ? "yaml" : "markdown",
        ...(kind === "research"
          ? {
              observes: [
                ...(parseDocument(sources[sourcePath]).metadata.sales_audit ===
                true
                  ? [`product.${product.id}.sales`]
                  : []),
                ...(product.analytics
                  ? [`product.${product.id}.analytics`]
                  : []),
              ],
            }
          : {}),
        uses: [
          ...inputRules[kind as keyof typeof inputRules],
          ...(product.model && kind !== "presentation-renderer"
            ? [`model.${product.model}`]
            : []),
        ]
          .map((key) =>
            key.startsWith("$") ? `product.${product.id}.${key.slice(1)}` : key,
          )
          .filter(
            (key) =>
              key.startsWith("product.") ||
              key.startsWith("model.") ||
              documents.some(({ id }) => id === key),
          ),
      });
      if (kind === "research" || kind === "sales")
        documents.find(({ id }) => id === "strategy")?.uses.push(id);
    }
    for (const page of productReviewPages(product)) {
      if (page.owner === "research" && page.source === product.research)
        continue;
      const sourcePath = `products/${catalogLayer}/${page.source}`;
      if (!Object.hasOwn(sources, sourcePath))
        throw new Error(`Missing review source: ${sourcePath}`);
      const owner = Object.hasOwn(productFields, page.owner)
        ? page.owner
        : "product";
      const isResearch = owner === "research";
      if (isResearch)
        documents
          .find(({ id }) => id === `product.${product.id}.research`)
          ?.uses.push(page.id);
      documents.push({
        id: page.id,
        path: sourcePath,
        source: sources[sourcePath],
        layer: catalogLayer,
        format: "markdown",
        uses: [
          ...(isResearch
            ? ["brief"].filter((id) => documents.some((doc) => doc.id === id))
            : [`product.${product.id}.${owner}`]),
          ...(product.model ? [`model.${product.model}`] : []),
          ...(page.uses ?? []),
        ],
        ...(isResearch &&
        parseDocument(sources[sourcePath]).metadata.sales_segment
          ? { observes: [`product.${product.id}.sales`] }
          : {}),
      });
    }
  }
  // The catalog is navigation data, not an approval gate for its own children.
  return documents;
}
