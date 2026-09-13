/**
 * BDD Suite: Short research finding identities across products and source layers.
 * Given: product research uses a stable product prefix and a source-layer marker.
 * When: Studio validates finding declarations and citations across a catalog.
 * Then: IDs stay short and unique without mistaking unrelated model names for findings.
 */
import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  parseResearchFindingId,
  validateResearchFindingIds,
} from "./research-ids";
import type { IResearchFindingDocument } from "./research-ids";
import {
  validateProductCatalogFiles,
  validateResearchSalesCoverage,
  salesResearchDimensions,
  productHeadings,
} from "./validate";
import type { IProductCatalog } from "../../../apps/studio/workspace/utils/products/catalog";

function research(
  layer: "singlepage" | "startup",
  productId: string,
  source: string,
  prefix = "EX",
): IResearchFindingDocument {
  return {
    layer,
    productId,
    sourcePath: `${layer}/${productId}/research.md`,
    source: source.startsWith("---\n")
      ? source.replace(/^---\n/, `---\nfinding_prefix: ${prefix}\n`)
      : `---\nfinding_prefix: ${prefix}\n---\n\n${source}`,
  };
}

describe("research finding identity", () => {
  /** BDD Scenario: Independent sequences. Given: products and source layers reuse number 01. When: validated. Then: prefixes and layer markers keep their findings distinct. */
  test("accepts the same number across products and source layers", () => {
    const documents = [
      research("singlepage", "example", "**EX-SPS-01 — fact.**"),
      research("singlepage", "other", "- **OT-SPS-01 — fact.**", "OT"),
      research("startup", "example", "| **EX-S-01** | Fact |"),
    ];
    expect(validateResearchFindingIds(documents).map(({ id }) => id)).toEqual([
      "EX-SPS-01",
      "OT-SPS-01",
      "EX-S-01",
    ]);
    expect(parseResearchFindingId("EX2-S-100")).toEqual({
      id: "EX2-S-100",
      layer: "startup",
      productPrefix: "EX2",
      number: "100",
    });
  });

  /** BDD Scenario: Prefix ownership. Given: two products in the same catalog choose EX. When: validated together. Then: the collision is rejected even with different finding numbers. */
  test("requires unique product prefixes within each source layer", () => {
    expect(() =>
      validateResearchFindingIds([
        research("startup", "example", "**EX-S-01**"),
        research("startup", "other", "**EX-S-02**"),
      ]),
    ).toThrow(
      "Duplicate research finding prefix EX in startup: example and other",
    );
  });

  /** BDD Scenario: Stable product mapping. Given: two inputs for the same product declare different prefixes. When: validated together. Then: the inconsistent mapping is rejected. */
  test("requires one prefix for each product in its source layer", () => {
    expect(() =>
      validateResearchFindingIds([
        research("startup", "example", "**EX-S-01**"),
        research("startup", "example", "**OT-S-02**", "OT"),
      ]),
    ).toThrow("inconsistent finding_prefix");
  });

  /** BDD Scenario: Explicit prefix registration. Given: Research has missing or malformed finding_prefix metadata. When: validated. Then: its short IDs cannot silently acquire an inferred owner. */
  test("requires an uppercase product prefix in Research metadata", () => {
    for (const source of [
      "**EX-S-01**",
      "---\nfinding_prefix: ex\n---\n**EX-S-01**",
      "---\nfinding_prefix: EX-1\n---\n**EX-S-01**",
      "---\nfinding_prefix: 123\n---\n**EX-S-01**",
    ])
      expect(() =>
        validateResearchFindingIds([
          { ...research("startup", "example", ""), source },
        ]),
      ).toThrow("finding_prefix must be an uppercase product prefix");
  });

  /** BDD Scenario: Repeated citations. Given: a finding appears in body and metadata with cross-layer citations and local source S1. When: validated. Then: only its declaration counts. */
  test("allows repeated short citations and document-local source labels", () => {
    const document = research(
      "startup",
      "example",
      "---\nsources:\n  decision:\n    finding_ids: [EX-S-01, EX-SPS-01, OT-S-02]\n---\n\n**EX-S-01 — fact.** [S1]\n\nSupported by [EX-S-01]. See EX-S-01 and EX-SPS-01.",
    );
    expect(validateResearchFindingIds([document])).toHaveLength(1);
  });

  /** BDD Scenario: Ordinary model and standard names. Given: prose and bold labels mention GPT-4 and ISO-9001 alongside a finding. When: validated. Then: unrelated names are not treated as finding declarations or citations. */
  test("accepts ordinary model and standard names in prose and bold labels", () => {
    const document = research(
      "startup",
      "example",
      "**EX-S-01 — observation.** Compare GPT-4 with another tool.\n\n**GPT-4** is a model name.\n\n- **ISO-9001** is an unrelated standard name.",
    );
    expect(validateResearchFindingIds([document])).toHaveLength(1);
  });

  /** BDD Scenario: Repeated definition. Given: a document defines the same short ID twice. When: validated. Then: the error identifies the duplicate finding. */
  test("rejects duplicate declarations within a document", () => {
    expect(() =>
      validateResearchFindingIds([
        research(
          "startup",
          "example",
          "**EX-S-01 — first.**\n\n- **EX-S-01 — second.**",
        ),
      ]),
    ).toThrow("Duplicate research finding EX-S-01");
  });

  /** BDD Scenario: Repeated identity across inputs. Given: separate documents declare the same product finding. When: validated together. Then: the duplicate declaration is rejected. */
  test("rejects the same definition across document inputs", () => {
    const document = research("startup", "example", "**EX-S-01**");
    expect(() =>
      validateResearchFindingIds([
        document,
        { ...document, sourcePath: "startup/example/other-research.md" },
      ]),
    ).toThrow("Duplicate research finding EX-S-01");
  });

  /** BDD Scenario: Wrong source owner. Given: startup Research declares a base-layer or different-prefix finding. When: validated. Then: the declaration is rejected, while citations may point to either owner. */
  test("rejects declarations for another layer or product prefix", () => {
    for (const id of ["EX-SPS-01", "OT-S-01"])
      expect(() =>
        validateResearchFindingIds([
          research("startup", "example", `**${id}**`),
        ]),
      ).toThrow("outside its owner startup/example");
  });

  /** BDD Scenario: Complete short syntax. Given: dotted, unqualified, wrongly cased, single-digit or abbreviated IDs. When: parsed. Then: only the agreed short format is accepted. */
  test("rejects old and malformed identities", () => {
    for (const id of [
      "EX-01",
      "singlepage.example.EX-01",
      "startup.example.EX-01",
      "default.example.EX-01",
      "EX-default-01",
      "Ex-S-01",
      "EX-S-1",
      "EX-S-one",
      "EX-S-01–03",
      "EX-S-01-03",
    ])
      expect(() => parseResearchFindingId(id)).toThrow(
        "Malformed research finding ID",
      );
  });

  /** BDD Scenario: Remaining old references. Given: declarations are short but a body or finding_ids citation uses the old format or an abbreviated range. When: validated. Then: the remaining invalid citation is rejected. */
  test("rejects old body and metadata references", () => {
    for (const source of [
      "**EX-S-01 — fact.**\n\nSupported by [EX-01].",
      "**EX-S-01 — fact.**\n\nSee startup.example.EX-01.",
      "**EX-S-01 — fact.**\n\nSee EX-S-01–03.",
      "---\nsources:\n  finding_ids: [EX-01]\n---\n\n**EX-S-01 — fact.**",
      "---\nsources:\n  finding_ids: [startup.example.EX-01]\n---\n\n**EX-S-01 — fact.**",
      "**EX-01 — unqualified declaration.**",
      "**startup.example.EX-01 — old declaration.**",
    ])
      expect(() =>
        validateResearchFindingIds([research("startup", "example", source)]),
      ).toThrow("Malformed research finding ID");
  });

  /** BDD Scenario: Embedded syntax examples. Given: comments and fenced examples contain old IDs. When: living findings are validated. Then: the examples do not create false declarations or citations. */
  test("ignores comments and fenced code examples", () => {
    const source = [
      "<!-- **EX-01 — example.** -->",
      "```md",
      "**EX-01 — example.**",
      "```",
      "~~~md",
      "**default.example.EX-01 — example.**",
      "~~~",
      "**EX-S-01 — actual finding.**",
    ].join("\n");
    expect(
      validateResearchFindingIds([research("startup", "example", source)]),
    ).toHaveLength(1);
  });

  /** BDD Scenario: Catalog integration. Given: two valid product file sets share a finding prefix. When: catalog files are checked. Then: validation catches the cross-product collision and accepts a distinct prefix after correction. */
  test("validates prefix ownership across the complete catalog", async () => {
    const layerRoot = await mkdtemp(path.join(tmpdir(), "sps-research-ids-"));
    const catalog: IProductCatalog = {
      schema: "singlepagestartup.product-catalog.v1",
      layer: "startup",
      models: [],
      products: ["example", "other"].map((id) => ({
        id,
        name: id,
        summary: id,
        sections: [],
        product: `${id}/product.md`,
        research: `${id}/research.md`,
        sales: `${id}/sales.yaml`,
      })),
    };
    try {
      for (const product of catalog.products) {
        await mkdir(path.join(layerRoot, product.id));
        await writeFile(path.join(layerRoot, product.product), "# Product\n");
        await writeFile(
          path.join(layerRoot, product.research),
          research("startup", product.id, "**EX-S-01**").source,
        );
        await writeFile(
          path.join(layerRoot, product.sales),
          `schema: singlepagestartup.sales-process.v1\nproduct_id: ${product.id}\nreadiness: blocked\nowner: Owner\nseller: Seller\npricing: Unset\ncapacity: Unset\nblockers: [Process unspecified]\nstages: []\n`,
        );
      }
      await expect(
        validateProductCatalogFiles(catalog, layerRoot),
      ).rejects.toThrow("Duplicate research finding prefix EX in startup");
      await writeFile(
        path.join(layerRoot, "other/research.md"),
        research("startup", "other", "**OT-S-01**", "OT").source,
      );
      await expect(
        validateProductCatalogFiles(catalog, layerRoot),
      ).resolves.toBeUndefined();
    } finally {
      await rm(layerRoot, { recursive: true, force: true });
    }
  });
});

/** BDD Scenario: Many customer groups need independent evidence. Given: ten Sales segments and complete dimension audits. When: coverage is validated. Then: every segment is retained with no count limit, while missing, foreign and duplicate segments are rejected. */
test("validates every Sales segment without limiting their number", () => {
  const ids = Array.from({ length: 10 }, (_, index) => `segment-${index}`);
  const summary = research(
    "startup",
    "example",
    "---\nsales_audit: true\n---\nSummary.",
  );
  const pages = ids.map((id) =>
    research(
      "startup",
      "example",
      `---\nsales_segment: ${id}\nsales_dimensions: [${salesResearchDimensions.join(", ")}]\n---\nEvidence.`,
    ),
  );
  expect(() =>
    validateResearchSalesCoverage([summary, ...pages], ids),
  ).not.toThrow();
  expect(() =>
    validateResearchSalesCoverage([summary, ...pages.slice(1)], ids),
  ).toThrow("missing Sales segments: segment-0");
  expect(() =>
    validateResearchSalesCoverage([summary, ...pages, pages[0]], ids),
  ).toThrow("Duplicate Research audit");
  expect(() =>
    validateResearchSalesCoverage([summary, ...pages], ids.slice(1)),
  ).toThrow("Unknown Sales segment segment-0");
  const incomplete = {
    ...pages[0],
    source: pages[0].source.replace("needs, ", ""),
  };
  expect(() =>
    validateResearchSalesCoverage(
      [summary, incomplete, ...pages.slice(1)],
      ids,
    ),
  ).toThrow("all Sales dimensions");
});

/** BDD Scenario: Detailed business context exceeds a preferred reading size. Given: a long Product and thirteen source rows in registered Research detail. When: all catalog files are validated. Then: no material text is rejected for length and duplicate finding declarations across pages are still detected. */
test("accepts long business pages and validates the complete Research corpus", async () => {
  const layerRoot = await mkdtemp(path.join(tmpdir(), "sps-research-corpus-"));
  const catalog: IProductCatalog = {
    schema: "singlepagestartup.product-catalog.v2",
    layer: "startup",
    models: [],
    products: [
      {
        id: "example",
        name: "Example",
        summary: "Example",
        product: "example/product.md",
        research: "example/research.md",
        sales: "example/sales.yaml",
        sections: [
          {
            id: "research",
            title: "Research",
            pages: [
              {
                id: "detail",
                title: "Detail",
                source: "example/detail.md",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
  try {
    await mkdir(path.join(layerRoot, "example"));
    await writeFile(
      path.join(layerRoot, "example/product.md"),
      productHeadings
        .map(
          (heading) =>
            `## ${heading}\n\n${"Material business context. ".repeat(100)}`,
        )
        .join("\n\n"),
    );
    await writeFile(
      path.join(layerRoot, "example/research.md"),
      research("startup", "example", "**EX-S-01** Summary.").source,
    );
    const detail = research(
      "startup",
      "example",
      "**EX-S-02** Detail.\n" +
        Array.from(
          { length: 13 },
          (_, index) => `| S${index} | Attributable source |`,
        ).join("\n"),
    ).source;
    await writeFile(path.join(layerRoot, "example/detail.md"), detail);
    await writeFile(
      path.join(layerRoot, "example/sales.yaml"),
      "schema: singlepagestartup.sales-process.v1\nproduct_id: example\nreadiness: blocked\nowner: Owner\nseller: Seller\npricing: Unset\ncapacity: Unset\nblockers: [Process unspecified]\nstages: []\n",
    );
    await expect(
      validateProductCatalogFiles(catalog, layerRoot),
    ).resolves.toBeUndefined();
    await writeFile(
      path.join(layerRoot, "example/detail.md"),
      detail.replace("EX-S-02", "EX-S-01"),
    );
    await expect(
      validateProductCatalogFiles(catalog, layerRoot),
    ).rejects.toThrow("Duplicate research finding EX-S-01");
  } finally {
    await rm(layerRoot, { recursive: true, force: true });
  }
});
