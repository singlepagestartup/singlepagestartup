import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { format } from "prettier";
import os from "node:os";
import path from "node:path";
import { stringify } from "yaml";

import { templateSections } from "./definition";

/**
 * Materializes a downstream repository whose startup layer owns every shared
 * document, so pipeline checks can be exercised against a complete project
 * without depending on the framework's own business content.
 */
export interface IDownstreamFixtureOptions {
  /** Write project content into the startup layer; false leaves it empty and inheriting. */
  populated?: boolean;
  /** Visual intake status per category; defaults to ready with interface out of scope. */
  visualIntake?: Partial<Record<(typeof VISUAL_CATEGORIES)[number], string>>;
  cursor?: {
    active_section?: string;
    status?: string;
  };
  /** Keep the framework base Design's interface section so it leaks into the resolved startup Design. */
  baseDesignInterface?: boolean;
  salesReadiness?: "ready" | "blocked";
  /** Drop one generated example file so the registry and the tree disagree. */
  missingGeneratedFile?: boolean;
  /** Register one generated directory instead of its files. */
  generatedDirectory?: boolean;
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

async function formatMarkdownSource(source: string): Promise<string> {
  return format(source, { parser: "markdown" });
}

export async function createDownstreamFixture(
  repositoryRoot: string,
  options: IDownstreamFixtureOptions = {},
): Promise<{ root: string; workspaceRoot: string; productId: string }> {
  const root = mkdtempSync(path.join(os.tmpdir(), "sps-pipeline-fixture-"));
  const workspaceRoot = path.join(root, WORKSPACE);
  const sectionsOf = (template: string) =>
    templateSections(repositoryRoot, template);
  const visibleSectionsOf = (template: string) =>
    [
      ...readFileSync(
        path.join(repositoryRoot, ".agents/templates", template),
        "utf8",
      ).matchAll(/^## (.+)$/gm),
    ].map((match) => match[1].trim());

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
    "schema: singlepagestartup.pre-development-state.v2\nactive_section: brief\nactive_stage: 00-business\nstatus: not_started\nprogress: {}\n",
  );
  write(
    root,
    `${WORKSPACE}/utils/pre-development/startup.yaml`,
    stringify({
      schema: "singlepagestartup.pre-development-state.v2",
      active_stage: "40-products",
      active_section: options.cursor?.active_section ?? "materials",
      active_product: PRODUCT_ID,
      status: options.cursor?.status ?? "in_progress",
      progress: {},
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
    write(root, `${WORKSPACE}/${kind}/singlepage.md`, base[kind]);
  write(
    root,
    `${WORKSPACE}/assets/singlepage.yaml`,
    "schema: singlepagestartup.asset-index.v1\nassets: []\n",
  );
  write(
    root,
    `${WORKSPACE}/products/singlepage/catalog.yaml`,
    "schema: singlepagestartup.product-catalog.v2\nproducts: []\n",
  );

  if (!(options.populated ?? true)) {
    for (const kind of SHARED_DOCUMENTS)
      write(root, `${WORKSPACE}/${kind}/startup.md`, "");
    write(root, `${WORKSPACE}/assets/startup.yaml`, "");
    write(
      root,
      `${WORKSPACE}/products/startup/catalog.yaml`,
      "schema: singlepagestartup.product-catalog.v2\nproducts: []\n",
    );
    return { root, workspaceRoot, productId: PRODUCT_ID };
  }

  // Downstream project: every shared document and product source is owned by startup.
  const project = (sections: string[]) =>
    sections.map((section, index): [string, string] => [
      section,
      `Downstream decision for ${section.toLowerCase()}.`,
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
  const writeShared = (kind: SharedDocument) =>
    write(
      root,
      `${WORKSPACE}/${kind}/startup.md`,
      withMetadata(overlay[kind], metadata[kind]),
    );
  for (const kind of SHARED_DOCUMENTS) {
    base[kind] = await formatMarkdownSource(base[kind]);
    overlay[kind] = await formatMarkdownSource(overlay[kind]);
  }
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
  const directory = `assets/startup/generated/${PROPOSAL_ID}/review-set`;
  if (options.generatedDirectory)
    assets.push({
      ...assets[0],
      id: "startup-generated-review-set",
      path: directory,
      purpose: "Fixture review set registered as one directory.",
    });
  write(
    root,
    `${WORKSPACE}/assets/startup.yaml`,
    `schema: singlepagestartup.asset-index.v1\n${stringify({ assets })}`,
  );
  for (const [index, asset] of assets.entries()) {
    if (options.missingGeneratedFile && index === 0) continue;
    if (asset.path === directory) continue;
    write(root, `${WORKSPACE}/${asset.path}`, "");
  }
  if (options.generatedDirectory)
    for (const name of ["one.png", "nested/two.png"])
      write(root, `${WORKSPACE}/${directory}/${name}`, "");

  const productRoot = `${WORKSPACE}/products/startup`;
  write(
    root,
    `${productRoot}/catalog.yaml`,
    stringify({
      schema: "singlepagestartup.product-catalog.v2",
      products: [
        {
          id: PRODUCT_ID,
          name: "Fixture product",
          summary: "A downstream product used to exercise the pipeline checks.",
          audience: `${PRODUCT_ID}/audience.md`,
          competitors: `${PRODUCT_ID}/competitors.md`,
          semantics: `${PRODUCT_ID}/semantics.md`,
          economics: `${PRODUCT_ID}/economics.md`,
          sales: `${PRODUCT_ID}/sales.yaml`,
          product: `${PRODUCT_ID}/product.md`,
        },
      ],
    }),
  );
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/product.md`,
    withMetadata(
      markdown("Product", project(visibleSectionsOf("product.md"))),
      {
        customer_segments: ["buyers"],
      },
    ),
  );
  for (const [kind, template] of [
    ["audience", "product-audience.md"],
    ["competitors", "product-research-competitors.md"],
    ["semantics", "product-semantics.md"],
    ["economics", "product-economics.md"],
  ])
    write(
      root,
      `${productRoot}/${PRODUCT_ID}/${kind}.md`,
      markdown(kind, project(visibleSectionsOf(template))),
    );
  const ready = (options.salesReadiness ?? "ready") === "ready";
  write(
    root,
    `${productRoot}/${PRODUCT_ID}/sales.yaml`,
    stringify({
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

  return { root, workspaceRoot, productId: PRODUCT_ID };
}
