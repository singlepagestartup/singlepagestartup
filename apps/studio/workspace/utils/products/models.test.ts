/**
 * BDD Suite: Product business models and safe migration.
 * Given: products may share or separate models across atomic source layers.
 * When: catalogs, reviews and a legacy structure are resolved.
 * Then: model ownership, content and approval boundaries are preserved.
 */
import { describe, expect, test } from "bun:test";
import { stringify } from "yaml";
import { parseProductCatalog, resolveProductCatalog } from "./catalog";
import {
  workspaceReviewDocuments,
  resolveDocumentReviews,
} from "../../../../../tools/studio/workspace/review";
import {
  parseDocument,
  renderDocument,
} from "../../../../../tools/studio/workspace/document";
import {
  businessTransferSections,
  migrateProductStructure,
} from "../../../../../tools/studio/products/migrate";

function fixture(
  bindings: Record<string, string> = {
    course: "learning",
    coaching: "learning",
    service: "service",
  },
) {
  return {
    schema: "singlepagestartup.product-catalog.v2",
    models: [...new Set(Object.values(bindings))].map((id) => ({
      id,
      name: id,
      source: `models/${id}/model.md`,
    })),
    products: Object.entries(bindings).map(([id, model]) => ({
      id,
      model,
      name: id,
      summary: `${id} offer`,
      product: `${id}/product.md`,
      research: `${id}/research.md`,
      sales: `${id}/sales.yaml`,
      sections: [
        {
          id: "content",
          title: "Product Content",
          pages: [
            {
              id: "lessons",
              title: "Lessons",
              children: [
                { id: "one", title: "One", source: `${id}/lessons/one.md` },
              ],
            },
          ],
        },
      ],
    })),
  };
}

describe("model ownership", () => {
  /** BDD Scenario: Early intake. Given: one known product. When: catalog loads before materials exist. Then: Product/model is usable without empty Website/deck pages. */
  test("accepts initial product and model before material production", () => {
    const catalog = parseProductCatalog(
      stringify(fixture({ course: "learning" })),
      "startup",
    );
    expect(catalog.products[0].model).toBe("learning");
    expect(catalog.products[0].presentation).toBeUndefined();
    expect(catalog.products[0].website).toBeUndefined();
  });
  /** BDD Scenario: Shared and separate models. Given: three products. When: their catalog loads. Then: two share one source and the third keeps its own. */
  test("keeps shared and separate models without copying sources", () => {
    const catalog = parseProductCatalog(stringify(fixture()), "singlepage");
    expect(catalog.models).toHaveLength(2);
    expect(catalog.products.map(({ model }) => model)).toEqual([
      "learning",
      "learning",
      "service",
    ]);
    expect(catalog.products[0].sections[0].pages[0].children[0].source).toBe(
      "course/lessons/one.md",
    );
  });
  /** BDD Scenario: Atomic layer scope. Given: base models and an empty or populated startup. When: default resolves. Then: its models always come from the selected catalog. */
  test("inherits and replaces models together with products", () => {
    const base = parseProductCatalog(stringify(fixture()), "singlepage");
    const empty = parseProductCatalog(
      "schema: singlepagestartup.product-catalog.v2\nproducts: []\nmodels: []",
      "startup",
    );
    expect(resolveProductCatalog(base, empty).catalog).toBe(base);
    const startup = parseProductCatalog(
      stringify(fixture({ client: "local" })),
      "startup",
    );
    const selected = resolveProductCatalog(base, startup).catalog;
    expect(selected.models.map(({ id }) => id)).toEqual(["local"]);
    expect(selected.layer).toBe("startup");
  });
  /** BDD Scenario: Invalid model reference. Given: a missing, unsafe or cyclic model. When: the catalog loads. Then: the failure is explicit without fallback. */
  test("rejects missing model ownership, escaped paths and model cycles", () => {
    const source = fixture();
    source.products[0].model = "other-layer";
    expect(() => parseProductCatalog(stringify(source), "startup")).toThrow(
      "own catalog",
    );
    const escaped = fixture();
    escaped.models[0].source = "../singlepage/models/learning/model.md";
    expect(() => parseProductCatalog(stringify(escaped), "startup")).toThrow();
    const cycle = fixture();
    Object.assign(cycle.models[0], { uses: ["service"] });
    Object.assign(cycle.models[1], { uses: ["learning"] });
    expect(() => parseProductCatalog(stringify(cycle), "startup")).toThrow(
      "cycle",
    );
  });
  /** BDD Scenario: Shared source change. Given: reviewed documents for two models. When: one shared model changes. Then: its products and Sales become stale and independent products stay current. */
  test("fans model changes out to every dependent without renewing consent", () => {
    const catalog = fixture();
    const indexes = {
      singlepage: {
        entries: [
          {
            id: "singlepage.products",
            kind: "products",
            path: "products/singlepage/catalog.yaml",
            uses: [],
          },
        ],
      },
      startup: { entries: [] },
    };
    const sources: Record<string, string> = {
      "products/singlepage/catalog.yaml": stringify(catalog),
    };
    for (const model of catalog.models)
      sources[`products/singlepage/${model.source}`] =
        `# Model\n\n${model.id} cost: 10`;
    for (const product of catalog.products)
      for (const field of ["research", "product", "sales"] as const)
        sources[`products/singlepage/${product[field]}`] =
          field === "sales" ? "owner: Owner\n" : `# ${field}\n\n${product.id}`;
    for (const product of catalog.products)
      sources[`products/singlepage/${product.id}/lessons/one.md`] =
        "# Lesson\n\nDelivered material.";
    const docs = workspaceReviewDocuments({
      indexes,
      sources,
      layer: "singlepage",
    });
    const before = resolveDocumentReviews(docs);
    for (const doc of docs) {
      const parsed = parseDocument(doc.source, doc.format);
      parsed.metadata.review = {
        dependencies: before.get(doc.id)!.dependencies,
      };
      doc.source =
        doc.format === "markdown"
          ? renderDocument(parsed)
          : stringify({ owner: "Owner", review: parsed.metadata.review });
    }
    const shared = docs.find(({ id }) => id === "model.learning")!;
    const original = shared.source;
    shared.source = shared.source.replace("cost: 10", "cost: 20");
    const after = resolveDocumentReviews(docs);
    for (const id of ["course", "coaching"])
      for (const kind of ["product", "sales", "research", "page.content.one"])
        expect(after.get(`product.${id}.${kind}`)!.confirmation.state).toBe(
          "stale",
        );
    expect(after.get("product.service.product")!.confirmation.state).toBe(
      "unconfirmed",
    );
    expect(after.get("model.learning")!.confirmation.confirmed).toBe(false);
    expect(parseDocument(shared.source).metadata).toEqual(
      parseDocument(original).metadata,
    );
    expect(docs.filter(({ id }) => id === "model.learning")).toHaveLength(1);
  });
  /** BDD Scenario: Legacy content transfer. Given: model assignments and a filled legacy Product/Business. When: mechanical migration runs. Then: unique content, nested pages and old hashes survive; Business requires semantic review. */
  test("renames structural headings without discarding content or blessing hashes", () => {
    const catalog = fixture({ course: "learning" });
    const old =
      "---\nconfirmation: { confirmed: true, content_sha256: old-hash }\nreview: { dependencies: { business: old-input } }\n---\n\n# Product Overview\n\n## Best-fit customer\nUnique customer facts\n\n## Positioning and value\nUnique offer\n\n## Custom legacy section\nKeep me\n";
    const result = migrateProductStructure({
      catalog: stringify({
        ...catalog,
        schema: "singlepagestartup.product-catalog.v1",
      }),
      documents: { "course/product.md": old },
    });
    expect(
      parseDocument(result.documents["course/product.md"]).metadata,
    ).toEqual(parseDocument(old).metadata);
    expect(result.documents["course/product.md"]).toContain(
      "Unique customer facts",
    );
    expect(result.documents["course/product.md"]).toContain(
      "## Custom legacy section\nKeep me",
    );
    expect(
      parseProductCatalog(result.catalog, "startup").products[0].sections,
    ).toEqual(
      parseProductCatalog(stringify(catalog), "startup").products[0].sections,
    );
    expect(
      businessTransferSections(
        "# Business\n\n## Funding\nOwner cash\n\n## Process\nWhole flow",
      ),
    ).toEqual(["Funding", "Process"]);
    const unassigned = fixture();
    delete (unassigned.products[0] as { model?: string }).model;
    expect(() =>
      migrateProductStructure({
        catalog: stringify(unassigned),
        documents: {},
      }),
    ).toThrow();
  });
});
