import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { stringify } from "yaml";

import { documentFingerprint } from "../../studio/workspace/document";
import { mergeMarkdown } from "../../studio/workspace/merge";
import { loadDocumentReviews } from "../../studio/workspace/review-loader";
import { templateSections } from "./definition";

/**
 * Materializes a downstream repository whose startup layer owns every shared
 * document, so pipeline checks can be exercised against a complete project
 * without depending on the framework's own business content.
 */
export interface IDownstreamFixtureOptions {
  /** Write project content into the startup layer; false leaves it empty and inheriting. */
  populated?: boolean;
  /** Which shared documents carry a startup confirmation with a valid fingerprint and input snapshot. */
  confirm?: Partial<Record<SharedDocument, boolean>>;
  /** Visual intake status per category; defaults to ready with interface out of scope. */
  visualIntake?: Partial<Record<(typeof VISUAL_CATEGORIES)[number], string>>;
  cursor?: {
    active_stage?: string;
    status?: string;
    active_artifacts?: string[];
    blockers?: string[];
  };
  /** Keep the framework base Design's interface section so it leaks into the resolved startup Design. */
  baseDesignInterface?: boolean;
  /** Schema of the framework base catalog; the startup catalog is always v2. */
  baseCatalogSchema?: "v1" | "v2";
  salesReadiness?: "ready" | "blocked";
  /** Drop one generated example file so the registry and the tree disagree. */
  missingGeneratedFile?: boolean;
  /** Add a retired evidence-register code to a document. */
  evidenceCode?: boolean;
}

export const VISUAL_CATEGORIES = [
  "interface-and-website-appearance",
  "typography",
  "photography",
  "illustration",
  "marketing-creative",
] as const;

type SharedDocument = "brief" | "strategy" | "brand" | "design";

const SHARED_DOCUMENTS: SharedDocument[] = [
  "brief",
  "strategy",
  "brand",
  "design",
];
const PRODUCT_ID = "fixture-product";
const MODEL_ID = "fixture-model";
const PROPOSAL_ID = "fixture-proposal";
const WORKSPACE = "apps/studio/workspace";

function markdown(title: string, sections: Array<[string, string]>): string {
  return `# ${title}\n\n${sections
    .map(([heading, text]) => `## ${heading}\n\n${text}`)
    .join("\n\n")}\n`;
}

function withMetadata(body: string, metadata: Record<string, unknown>): string {
  return `---\n${stringify(metadata).trimEnd()}\n---\n\n${body}`;
}

function write(root: string, relative: string, content: string) {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export async function createDownstreamFixture(
  repositoryRoot: string,
  options: IDownstreamFixtureOptions = {},
): Promise<{ root: string; workspaceRoot: string; productId: string }> {
  const root = mkdtempSync(path.join(os.tmpdir(), "sps-pipeline-fixture-"));
  const workspaceRoot = path.join(root, WORKSPACE);
  const sectionsOf = (template: string) =>
    templateSections(repositoryRoot, template);

  cpSync(path.join(repositoryRoot, ".agents"), path.join(root, ".agents"), {
    recursive: true,
  });
  for (const layer of ["singlepage", "startup"]) {
    cpSync(
      path.join(repositoryRoot, WORKSPACE, "utils/index", `${layer}.yaml`),
      path.join(workspaceRoot, "utils/index", `${layer}.yaml`),
    );
  }
  write(
    root,
    `${WORKSPACE}/utils/config.yaml`,
    "schema: singlepagestartup.workspace-config.v1\ndefault_layer: startup\nrepository_layers:\n  singlepagestartup/singlepagestartup: singlepage\n",
  );
  write(
    root,
    `${WORKSPACE}/utils/pre-development/singlepage.yaml`,
    "schema: singlepagestartup.pre-development-state.v1\nactive_stage: 00-business\nstatus: not_started\nactive_artifacts:\n  - brief\nblockers: []\n",
  );
  write(
    root,
    `${WORKSPACE}/utils/pre-development/startup.yaml`,
    stringify({
      schema: "singlepagestartup.pre-development-state.v1",
      active_stage: options.cursor?.active_stage ?? "40-products",
      status: options.cursor?.status ?? "in_progress",
      active_artifacts: options.cursor?.active_artifacts ?? ["products"],
      blockers: options.cursor?.blockers ?? [],
    }),
  );

  // Framework base: template-complete documents with framework example text.
  const baseSections = (template: string, omit: string[] = []) =>
    sectionsOf(template)
      .filter((section) => !omit.includes(section))
      .map((section): [string, string] => [
        section,
        `Framework ${section.toLowerCase()} example.`,
      ]);
  const base: Record<SharedDocument, string> = {
    brief: markdown("Brief", baseSections("templates/brief.md")),
    strategy: markdown("Strategy", baseSections("templates/strategy.md")),
    brand: markdown("Brand", baseSections("templates/brand.md")),
    design: markdown(
      "Design",
      baseSections(
        "templates/design.md",
        options.baseDesignInterface ? [] : ["Interface and product surfaces"],
      ),
    ),
  };
  for (const kind of SHARED_DOCUMENTS)
    write(
      root,
      `${WORKSPACE}/${kind}/singlepage.md`,
      withMetadata(base[kind], { confirmation: { confirmed: false } }),
    );
  write(
    root,
    `${WORKSPACE}/assets/singlepage.yaml`,
    "schema: singlepagestartup.asset-index.v1\nconfirmation:\n  confirmed: false\nassets: []\n",
  );
  write(
    root,
    `${WORKSPACE}/products/singlepage/catalog.yaml`,
    `schema: singlepagestartup.product-catalog.${options.baseCatalogSchema ?? "v2"}\nmodels: []\nproducts: []\n`,
  );

  if (!(options.populated ?? true)) {
    for (const kind of SHARED_DOCUMENTS)
      write(root, `${WORKSPACE}/${kind}/startup.md`, "");
    write(root, `${WORKSPACE}/assets/startup.yaml`, "");
    write(
      root,
      `${WORKSPACE}/products/startup/catalog.yaml`,
      "schema: singlepagestartup.product-catalog.v2\nmodels: []\nproducts: []\n",
    );
    return { root, workspaceRoot, productId: PRODUCT_ID };
  }

  // Downstream project: every shared document and product source is owned by startup.
  const project = (sections: string[]) =>
    sections.map((section, index): [string, string] => [
      section,
      `Downstream decision for ${section.toLowerCase()}.${options.evidenceCode && index === 0 ? " See ST-EV-04." : ""}`,
    ]);
  const examples = (family: string) =>
    [
      "| Example | Use | Content brief | Avoid | Asset ID |",
      "| --- | --- | --- | --- | --- |",
      ...[1, 2, 3].map(
        (n) =>
          `| ${family} ${n} | Use ${n} | Brief ${n} | Avoid ${n} | \`startup-generated-${family}-${n}\` |`,
      ),
    ].join("\n");
  const overlay: Record<SharedDocument, string> = {
    brief: markdown("Brief", project(sectionsOf("templates/brief.md"))),
    strategy: markdown(
      "Strategy",
      project(sectionsOf("templates/strategy.md")),
    ),
    brand: markdown("Brand", project(sectionsOf("templates/brand.md"))),
    design: markdown(
      "Design",
      sectionsOf("templates/design.md")
        .filter((section) => section !== "Interface and product surfaces")
        .map((section): [string, string] => {
          if (section === "Photography")
            return [
              section,
              `### Purpose and evidence boundary\n\nPeople at work.\n\n### Generation examples\n\n${examples("photography")}`,
            ];
          if (section === "Illustration and diagrams")
            return [
              section,
              `### Purpose and evidence boundary\n\nDiagrams.\n\n### Generation examples\n\n${examples("illustration")}`,
            ];
          return [section, `Downstream decision for ${section.toLowerCase()}.`];
        }),
    ),
  };
  const intake: Record<string, unknown> = {};
  for (const category of VISUAL_CATEGORIES) {
    intake[category] = {
      status:
        options.visualIntake?.[category] ??
        (category === "interface-and-website-appearance"
          ? "out-of-scope"
          : "ready"),
      asset_ids: [],
    };
  }
  const metadata: Record<SharedDocument, Record<string, unknown>> = {
    brief: {
      intake: {
        scope: {
          confirmed: true,
          at: "2026-09-18",
          source: "Fixture operator confirmed the product scope.",
          project: "Downstream fixture",
          products: [PRODUCT_ID],
        },
      },
      visual_references: intake,
    },
    strategy: {},
    brand: {},
    design: { proposal_id: PROPOSAL_ID },
  };
  const confirm = {
    brief: true,
    strategy: true,
    brand: true,
    design: true,
    ...options.confirm,
  };
  const writeShared = (
    kind: SharedDocument,
    dependencies?: Record<string, string>,
  ) => {
    const confirmation = confirm[kind]
      ? {
          confirmed: true,
          by: "operator",
          at: "2026-09-18",
          source:
            "Fixture operator confirmed the complete downstream document.",
          content_sha256: documentFingerprint(
            mergeMarkdown(base[kind], overlay[kind]).content,
          ),
        }
      : { confirmed: false };
    write(
      root,
      `${WORKSPACE}/${kind}/startup.md`,
      withMetadata(overlay[kind], {
        ...metadata[kind],
        confirmation,
        ...(dependencies ? { review: { dependencies } } : {}),
      }),
    );
  };
  for (const kind of SHARED_DOCUMENTS) writeShared(kind);

  const assets = [
    ...[1, 2, 3].map((n) => `photography-${n}`),
    ...[1, 2, 3].map((n) => `illustration-${n}`),
  ].map((name) => ({
    id: `startup-generated-${name}`,
    path: `assets/startup/generated/${PROPOSAL_ID}/${name}.png`,
    source_type: "generated",
    lifecycle: "proposed",
    proposal_id: PROPOSAL_ID,
    evidence: false,
    rights_status: "Generated for the fixture project.",
    purpose: `Fixture ${name} example.`,
    related_artifacts: ["startup.design"],
    allowed_use: ["review"],
    prohibited_use: ["publication"],
    prompt: "Fixture prompt.",
    source_or_tool: "fixture",
  }));
  write(
    root,
    `${WORKSPACE}/assets/startup.yaml`,
    `schema: singlepagestartup.asset-index.v1\nconfirmation:\n  confirmed: false\n${stringify({ assets })}`,
  );
  for (const [index, asset] of assets.entries()) {
    if (options.missingGeneratedFile && index === 0) continue;
    write(root, `${WORKSPACE}/${asset.path}`, "");
  }

  const productRoot = `${WORKSPACE}/products/startup`;
  write(
    root,
    `${productRoot}/catalog.yaml`,
    stringify({
      schema: "singlepagestartup.product-catalog.v2",
      models: [
        {
          id: MODEL_ID,
          name: "Fixture model",
          source: `models/${MODEL_ID}/model.md`,
        },
      ],
      products: [
        {
          id: PRODUCT_ID,
          model: MODEL_ID,
          name: "Fixture product",
          summary: "A downstream product used to exercise the pipeline checks.",
          research: `${PRODUCT_ID}/research.md`,
          analytics: `${PRODUCT_ID}/analytics.md`,
          sales: `${PRODUCT_ID}/sales.yaml`,
          product: `${PRODUCT_ID}/product.md`,
        },
      ],
    }),
  );
  write(
    root,
    `${productRoot}/models/${MODEL_ID}/model.md`,
    withMetadata(
      markdown(
        "Operations & Economics",
        project(sectionsOf("templates/product-model.md")),
      ),
      {
        confirmation: { confirmed: false },
      },
    ),
  );
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/product.md`,
    withMetadata(
      markdown("Product", project(sectionsOf("templates/product.md"))),
      {
        confirmation: { confirmed: false },
        customer_segments: ["buyers"],
      },
    ),
  );
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/research.md`,
    withMetadata(
      markdown(
        "Product research",
        sectionsOf("templates/product-research.md").map(
          (section): [string, string] => [
            section,
            section === "Findings and unknowns"
              ? "**FX-S-01** — observation: the fixture market exists."
              : `Downstream research for ${section.toLowerCase()}.`,
          ],
        ),
      ),
      { confirmation: { confirmed: false }, finding_prefix: "FX" },
    ),
  );
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/analytics.md`,
    withMetadata(
      markdown(
        "Product analytics",
        project(sectionsOf("templates/product-analytics.md")),
      ),
      {
        confirmation: { confirmed: false },
      },
    ),
  );
  const ready = (options.salesReadiness ?? "ready") === "ready";
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/sales.yaml`,
    stringify({
      confirmation: { confirmed: false },
      schema: "singlepagestartup.sales-process.v2",
      product_id: PRODUCT_ID,
      readiness: ready ? "ready" : "blocked",
      owner: "Fixture owner",
      seller: "Fixture seller",
      pricing: "Reference the model Revenue Streams row.",
      capacity: "One owner.",
      blockers: ready ? [] : ["Choose the price."],
      segments: [
        {
          id: "buyers",
          name: "Buyers",
          audience: "People who buy the fixture product.",
          roles: "User, buyer and payer are the same person.",
          needs: ["A working fixture."],
          motivations: ["Confidence."],
          purchase_trigger: "A new project starts.",
          decision_criteria: ["Fit."],
          value_proposition: "A complete fixture.",
          objections: [
            {
              concern: "Is it real?",
              response: "It is a fixture.",
              evidence: "This file.",
            },
          ],
          acquisition: [
            {
              id: "web",
              channel: "Website",
              context: "Searching for a fixture.",
              message: "Use the fixture.",
              cta: "Start",
              destination: "The fixture page.",
            },
          ],
          journey: [
            {
              id: "discover",
              name: "Discover",
              customer_goal: "Find the fixture.",
              customer_action: "Open the page.",
              customer_question: "Is this for me?",
              experience: "Clear.",
              touchpoint: "Website",
              owner: "Fixture owner",
              entry_conditions: ["A need exists."],
              required_fields: [],
              action: "Explain the fixture.",
              exit_condition: "The buyer starts.",
              failure: "The buyer leaves.",
              metric: "Starts.",
            },
          ],
        },
      ],
    }),
  );

  // Second pass: a confirmed document also records the fingerprints of the
  // inputs it was reviewed against, exactly as the review resolver expects.
  const reviews = await loadDocumentReviews(workspaceRoot, "startup");
  for (const kind of SHARED_DOCUMENTS) {
    if (!confirm[kind]) continue;
    const review = reviews.get(kind);
    if (review && Object.keys(review.dependencies).length)
      writeShared(kind, review.dependencies);
  }

  return { root, workspaceRoot, productId: PRODUCT_ID };
}
