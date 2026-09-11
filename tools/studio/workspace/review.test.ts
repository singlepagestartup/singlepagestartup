/**
 * BDD Suite: Dependency review of living documents
 * Given documents record the inputs on which their current decisions rely
 * When an input or its resolved layer changes
 * Then dependents require impact review without inventing user confirmation
 */
import { describe, expect, test } from "bun:test";
import { parse, stringify } from "yaml";
import { documentFingerprint, parseDocument, renderDocument } from "./document";
import { mergeMarkdown, mergeYaml } from "./merge";
import {
  resolveDocumentReviews,
  workspaceReviewDocuments,
  type IReviewDocument,
  type IReviewIndexEntry,
} from "./review";

function doc(
  id: string,
  uses: string[] = [],
  approved = false,
): IReviewDocument {
  const body = `# ${id}\n\nCurrent ${id} decision.\n`;
  return {
    id,
    uses,
    source: renderDocument({
      body,
      metadata: {
        confirmation: approved
          ? {
              confirmed: true,
              by: "operator",
              at: "2026-09-11",
              content_sha256: documentFingerprint(body),
            }
          : { confirmed: false },
      },
    }),
    path: `${id}/singlepage.md`,
    layer: "singlepage",
    format: "markdown",
  };
}
function update(document: IReviewDocument, metadata: Record<string, unknown>) {
  const parsed = parseDocument(document.source, document.format);
  document.source =
    document.format === "yaml"
      ? stringify({ ...parse(parsed.body), ...parsed.metadata, ...metadata })
      : renderDocument({
          ...parsed,
          metadata: { ...parsed.metadata, ...metadata },
        });
}
function inspect(documents: IReviewDocument[], id: string) {
  const document = documents.find((document) => document.id === id)!;
  update(document, {
    review: {
      dependencies: resolveDocumentReviews(documents).get(id)!.dependencies,
    },
  });
}
function chain() {
  const documents = [
    doc("business"),
    doc("strategy", ["business"], true),
    doc("brand", ["strategy"], true),
  ];
  inspect(documents, "strategy");
  inspect(documents, "brand");
  return documents;
}

describe("dependency review", () => {
  /**
   * BDD Scenario: A price correction requests semantic review without importing text
   * Given Product and Presentation store their own content and reviewed inputs
   * When the price in Business changes
   * Then they become stale while their own source documents remain unchanged
   */
  test("flags a price change without replacing dependent content", () => {
    const documents = [
      doc("business"),
      doc("product", ["business"]),
      doc("presentation", ["product"]),
    ];
    inspect(documents, "product");
    inspect(documents, "presentation");
    const productSource = documents[1].source;
    const presentationSource = documents[2].source;
    documents[0].source += "\nPrice is now USD 20.\n";
    const reviews = resolveDocumentReviews(documents);
    expect(reviews.get("product")!.confirmation.state).toBe("stale");
    expect(reviews.get("presentation")!.confirmation.state).toBe("stale");
    expect(documents[1].source).toBe(productSource);
    expect(documents[2].source).toBe(presentationSource);
  });
  /**
   * BDD Scenario: An unchanged approved document receives changed premises
   * Given Strategy and Brand were reviewed against their inputs
   * When Business changes
   * Then both dependents become stale while their own bodies stay unchanged
   */
  test("propagates upstream changes through unchanged documents", () => {
    const documents = chain();
    documents[0].source += "\nCapacity is reduced.\n";
    const reviews = resolveDocumentReviews(documents);
    expect(reviews.get("strategy")!.confirmation).toMatchObject({
      state: "stale",
      confirmed: false,
      sources: ["business"],
    });
    expect(reviews.get("brand")!.confirmation).toMatchObject({
      state: "stale",
      sources: ["strategy"],
    });
  });

  /**
   * BDD Scenario: A source edit does not affect the downstream decision
   * Given a Business clarification marks Strategy and Brand stale
   * When the owner reviews the effect and refreshes Strategy inputs
   * Then unchanged approvals become usable without another user approval
   */
  test("preserves approval after a no-material-effect review", () => {
    const documents = chain();
    const approval = parseDocument(documents[1].source).metadata.confirmation;
    documents[0].source += "\nSource attribution clarified.\n";
    inspect(documents, "strategy");
    const reviews = resolveDocumentReviews(documents);
    expect(reviews.get("strategy")!.confirmation.state).toBe("confirmed");
    expect(reviews.get("brand")!.confirmation.state).toBe("confirmed");
    expect(parseDocument(documents[1].source).metadata.confirmation).toEqual(
      approval,
    );
  });

  /**
   * BDD Scenario: Known material impact remains unresolved
   * Given Strategy has an explicit stale reason
   * When current input hashes are copied without revising the decision
   * Then the stale marker and downstream block remain effective
   */
  test("does not let refreshed hashes clear a known material problem", () => {
    const documents = chain();
    update(documents[1], {
      review: {
        dependencies:
          resolveDocumentReviews(documents).get("strategy")!.dependencies,
        stale: {
          reason: "Capacity contradicts launch scope.",
          sources: ["business"],
        },
      },
    });
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.reason,
    ).toBe("Capacity contradicts launch scope.");
    expect(
      resolveDocumentReviews(documents).get("brand")!.confirmation.state,
    ).toBe("stale");
  });

  /**
   * BDD Scenario: Approval predates recorded input review
   * Given a confirmed document has dependencies but no input snapshot
   * When its status is resolved
   * Then it needs input review while a new draft stays unconfirmed
   */
  test("requires a baseline for existing approvals without approving drafts", () => {
    const documents = [
      doc("business"),
      doc("strategy", ["business"], true),
      doc("draft", ["business"]),
    ];
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.state,
    ).toBe("stale");
    expect(
      resolveDocumentReviews(documents).get("draft")!.confirmation.state,
    ).toBe("unconfirmed");
    inspect(documents, "draft");
    expect(
      resolveDocumentReviews(documents).get("draft")!.confirmation.state,
    ).toBe("unconfirmed");
    documents[0].source += "Changed input.";
    expect(
      resolveDocumentReviews(documents).get("draft")!.confirmation.state,
    ).toBe("stale");
  });

  /**
   * BDD Scenario: The input set changes
   * Given an artifact's reviewed dependency set
   * When an input is missing, removed, or added
   * Then the previous input review cannot pass silently
   */
  test("detects missing, removed, and newly declared inputs", () => {
    const missing = chain();
    missing.shift();
    expect(
      resolveDocumentReviews(missing).get("strategy")!.confirmation.sources,
    ).toEqual(["business"]);
    const removed = chain();
    removed[1].uses = [];
    expect(
      resolveDocumentReviews(removed).get("strategy")!.confirmation.state,
    ).toBe("stale");
    const added = chain();
    added.push(doc("research"));
    added[1].uses.push("research");
    expect(
      resolveDocumentReviews(added).get("strategy")!.confirmation.sources,
    ).toEqual(["research"]);
  });

  /**
   * BDD Scenario: A startup override hides a base input change
   * Given Strategy reviewed the resolved startup Business
   * When only an overridden base section changes
   * Then Strategy stays confirmed until a retained section changes
   */
  test("compares effective inputs rather than hidden base text", () => {
    const base = "# Business\n\n## Offer\n\nFree.\n\n## Capacity\n\nSix hours.";
    const overlay = "# Business\n\n## Offer\n\nPaid.";
    const documents = chain();
    documents[0].source = mergeMarkdown(base, overlay).content;
    inspect(documents, "strategy");
    documents[0].source = mergeMarkdown(
      base.replace("Free.", "New hidden offer."),
      overlay,
    ).content;
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.state,
    ).toBe("confirmed");
    documents[0].source = mergeMarkdown(
      base.replace("Six hours.", "Two hours."),
      overlay,
    ).content;
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.state,
    ).toBe("stale");
  });

  /**
   * BDD Scenario: Review an inherited stale document for startup
   * Given singlepage contains a stale marker
   * When startup supplies a complete metadata-only review override
   * Then inherited text remains and the local review replaces the base review
   */
  test("supports atomic review overrides and resets snapshots on new bodies", () => {
    const base = renderDocument({
      body: "# Strategy\n\nCurrent decision.",
      metadata: {
        review: {
          dependencies: {},
          stale: { reason: "Old upstream change.", sources: ["business"] },
        },
      },
    });
    const merged = mergeMarkdown(
      base,
      "---\nreview:\n  dependencies: {}\n---\n",
    );
    expect(parseDocument(merged.content).metadata.review).toEqual({
      dependencies: {},
    });
    expect(parseDocument(merged.content).body).toContain("Current decision.");
    expect(
      parseDocument(
        mergeMarkdown(base, "# Strategy\n\nLocal decision.").content,
      ).metadata.review,
    ).toBeUndefined();
  });

  /**
   * BDD Scenario: Review metadata changes in a YAML source
   * Given Sales has a stable current process
   * When review metadata changes or startup overrides it
   * Then the process fingerprint is stable and the review override is atomic
   */
  test("excludes YAML review metadata from body hashes", () => {
    const body = "schema: sales.v1\ncapacity: 6\n";
    const source = `${body}review:\n  dependencies: {}\n  stale:\n    reason: Capacity review.\n    sources: [business]\n`;
    expect(documentFingerprint(source, "yaml")).toBe(
      documentFingerprint(body, "yaml"),
    );
    expect(
      parseDocument(
        mergeYaml(source, "review:\n  dependencies: {}\n").content,
        "yaml",
      ).metadata.review,
    ).toEqual({ dependencies: {} });
    expect(
      parseDocument(mergeYaml(source, "capacity: 2\n").content, "yaml").metadata
        .review,
    ).toBeUndefined();
  });

  /**
   * BDD Scenario: Invalid dependencies cannot silently resolve
   * Given a cyclic graph or incomplete material-impact marker
   * When the status resolver reads it
   * Then it reports a descriptive validation error
   */
  test("rejects cycles and incomplete stale metadata", () => {
    expect(() =>
      resolveDocumentReviews([doc("a", ["b"]), doc("b", ["a"])]),
    ).toThrow("dependency cycle");
    expect(() =>
      parseDocument("---\nreview:\n  stale: { reason: Broken }\n---\nBody"),
    ).toThrow("source document IDs");
  });
});

function catalogFixture() {
  const entries: IReviewIndexEntry[] = [
    "brief",
    "business",
    "strategy",
    "brand",
    "design",
    "products",
  ].map((kind) => ({
    id: `singlepage.${kind}`,
    kind,
    path:
      kind === "products"
        ? "products/singlepage/catalog.yaml"
        : `${kind}/singlepage.md`,
    uses: [],
  }));
  const indexes = {
    singlepage: { entries },
    startup: {
      entries: entries.map((entry) => ({
        ...entry,
        id: entry.id.replace("singlepage", "startup"),
        extends: entry.id,
        path: entry.path.replace("singlepage", "startup"),
        strategy:
          entry.kind === "products"
            ? ("product-catalog" as const)
            : ("sections" as const),
      })),
    },
  };
  const sources = Object.fromEntries(
    entries.map((entry) => [
      entry.path,
      `# ${entry.kind}\n\nCurrent decision.`,
    ]),
  );
  for (const entry of indexes.startup.entries) sources[entry.path] = "";
  const product = (id: string, layer: string) => {
    for (const field of [
      "research",
      "sales",
      "product",
      "website",
      "marketing_creative",
    ])
      sources[
        `products/${layer}/${id}/${field}.${field === "sales" ? "yaml" : "md"}`
      ] =
        field === "sales"
          ? "schema: sales.v1\ncapacity: 6\n"
          : `# ${field}\n\n${id} decision.`;
    return `  - { id: ${id}, research: ${id}/research.md, sales: ${id}/sales.yaml, product: ${id}/product.md, website: ${id}/website.md, marketing_creative: ${id}/marketing_creative.md }\n`;
  };
  sources["products/singlepage/catalog.yaml"] =
    `products:\n${product("a", "singlepage")}${product("b", "singlepage")}`;
  return { indexes, sources, product, layer: "startup" as const };
}

describe("product and layer review graph", () => {
  /**
   * BDD Scenario: One product's delivery changes
   * Given two products share Strategy but own separate Product and Website sources
   * When Product A changes
   * Then its website becomes stale and Product B stays unaffected
   */
  test("isolates product-local dependencies", () => {
    const documents = workspaceReviewDocuments(catalogFixture());
    for (const document of documents) inspect(documents, document.id);
    documents.find(({ id }) => id === "product.a.product")!.source +=
      "\nDelivery changed.";
    const reviews = resolveDocumentReviews(documents);
    expect(reviews.get("product.a.website")!.confirmation.state).toBe("stale");
    expect(reviews.get("product.b.website")!.confirmation.state).toBe(
      "unconfirmed",
    );
  });

  /**
   * BDD Scenario: A downstream project introduces its own decision input
   * Given startup Strategy refers to a local knowledge source without a base
   * When that source changes after input review
   * Then it participates in staleness just like inherited sources
   */
  test("tracks startup-only supporting inputs", () => {
    const fixture = catalogFixture();
    fixture.indexes.startup.entries.push({
      id: "startup.constraints",
      kind: "knowledge",
      path: "knowledge/constraints/startup.md",
      uses: [],
    } as IReviewIndexEntry as (typeof fixture.indexes.startup.entries)[number]);
    fixture.indexes.startup.entries.find(
      ({ kind }) => kind === "strategy",
    )!.uses = ["startup.constraints"];
    fixture.sources["knowledge/constraints/startup.md"] =
      "# Constraints\n\nCurrent local boundary.";
    const documents = workspaceReviewDocuments(fixture);
    inspect(documents, "strategy");
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.state,
    ).toBe("unconfirmed");
    documents.find(({ id }) => id === "constraints")!.source +=
      "\nChanged boundary.";
    expect(
      resolveDocumentReviews(documents).get("strategy")!.confirmation.sources,
    ).toContain("constraints");
  });

  /**
   * BDD Scenario: Startup replaces the product set
   * Given the base contains two products whose files are unavailable
   * When startup supplies its own atomic catalog
   * Then only startup product inputs participate in review
   */
  test("resolves only the selected product catalog", () => {
    const fixture = catalogFixture();
    fixture.sources["products/startup/catalog.yaml"] =
      `products:\n${fixture.product("local", "startup")}`;
    for (const key of Object.keys(fixture.sources))
      if (
        key.startsWith("products/singlepage/") &&
        key !== "products/singlepage/catalog.yaml"
      )
        delete fixture.sources[key];
    const documents = workspaceReviewDocuments(fixture);
    expect(
      documents
        .filter(({ id }) => id.startsWith("product."))
        .map(({ id }) => id),
    ).toHaveLength(5);
    expect(documents.find(({ id }) => id === "strategy")!.uses).toEqual([
      "product.local.research",
      "product.local.sales",
    ]);
    expect(
      documents.find(({ id }) => id === "product.local.product")!.layer,
    ).toBe("startup");
  });
});
