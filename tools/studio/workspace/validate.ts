import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseProductCatalog } from "../../../apps/studio/workspace/utils/products/catalog";
import {
  validateProductCatalogFiles,
  validateProductSectionFiles,
} from "../products/validate";
import { validateDesignLayouts } from "../design/validate";

import {
  loadWorkspace,
  WorkspaceValidationError,
  type WorkspaceLayerSelection,
} from "./loader";

interface ICliOptions {
  activeLayer?: WorkspaceLayerSelection;
  repositoryIdentity?: string;
  selfCheck: boolean;
  workspaceRoot?: string;
}

function parseCliOptions(argv: string[]): ICliOptions {
  const options: ICliOptions = { selfCheck: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [name, inlineValue] = argument.split("=", 2);
    const value = inlineValue ?? argv[index + 1];
    if (name === "--self-check") options.selfCheck = true;
    else if (name === "--workspace-root" && value) {
      options.workspaceRoot = value;
      if (!inlineValue) index += 1;
    } else if (name === "--repository" && value) {
      options.repositoryIdentity = value;
      if (!inlineValue) index += 1;
    } else if (
      name === "--active-layer" &&
      ["auto", "singlepage", "startup"].includes(value)
    ) {
      options.activeLayer = value as WorkspaceLayerSelection;
      if (!inlineValue) index += 1;
    }
  }
  return options;
}

async function writeFixture(
  root: string,
  options: {
    startupIndex?: string;
    singlepageIndex?: string;
    omit?: string[];
  } = {},
) {
  const workspaceRoot = path.join(root, "workspace");
  const indexRoot = path.join(workspaceRoot, "utils/index");
  const singlepageRoot = path.join(workspaceRoot, "singlepage");
  const startupRoot = path.join(workspaceRoot, "startup");
  await Promise.all([
    mkdir(indexRoot, { recursive: true }),
    mkdir(singlepageRoot, { recursive: true }),
    mkdir(startupRoot, { recursive: true }),
  ]);
  const singlepageIndex =
    options.singlepageIndex ??
    `schema: fixture.v1\nlayer: singlepage\nentries:\n  - { id: template.base, kind: template, path: singlepage/base.md, description: Exported template., uses: [] }\n  - { id: singlepage.discovery, kind: discovery, path: singlepage/discovery.md, description: Framework discovery., uses: [] }\n  - { id: singlepage.secret, kind: brief, path: singlepage/secret.md, description: Private local artifact., uses: [singlepage.discovery] }\n  - { id: singlepage.brand, kind: brand, path: singlepage/brand.md, description: Framework brand., uses: [singlepage.secret] }\n  - { id: singlepage.products, kind: products, path: singlepage/products.yaml, description: Framework products., uses: [singlepage.brand] }\nexports: [template.base]\nimports: []\n`;
  const startupIndex =
    options.startupIndex ??
    `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.discovery, kind: discovery, path: startup/discovery.md, extends: singlepage.discovery, strategy: replace, description: Client discovery., uses: [] }\n  - { id: startup.brief, kind: brief, path: startup/brief.md, extends: singlepage.secret, strategy: sections, description: Local startup artifact., uses: [template.base, startup.discovery] }\n  - { id: startup.brand, kind: brand, path: startup/brand.md, extends: singlepage.brand, strategy: sections, description: Client brand., uses: [startup.brief] }\n  - { id: startup.products, kind: products, path: startup/products.yaml, extends: singlepage.products, strategy: product-catalog, description: Client products., uses: [startup.brand] }\nexports: []\nimports: [template.base]\n`;
  await Promise.all([
    writeFile(path.join(indexRoot, "singlepage.yaml"), singlepageIndex),
    writeFile(path.join(indexRoot, "startup.yaml"), startupIndex),
    writeFile(path.join(singlepageRoot, "base.md"), "# Base\n"),
    writeFile(
      path.join(singlepageRoot, "discovery.md"),
      "# Discovery\n\n## Shared question\n\nFramework question.\n\n## Local finding\n\nFramework finding.\n",
    ),
    writeFile(
      path.join(startupRoot, "discovery.md"),
      "# Discovery\n\n## Shared question\n\n## Local finding\n\nClient finding.\n",
    ),
    writeFile(
      path.join(singlepageRoot, "secret.md"),
      "# Brief\n\n## Shared direction\n\nFramework direction.\n\n## Client detail\n\nFramework default.\n",
    ),
    writeFile(
      path.join(startupRoot, "brief.md"),
      "# Brief\n\n## Shared direction\n\n## Client detail\n\nClient override.\n",
    ),
    writeFile(
      path.join(singlepageRoot, "brand.md"),
      "# Brand\n\n## Model\n\nFramework model.\n",
    ),
    writeFile(
      path.join(startupRoot, "brand.md"),
      "# Brand\n\n## Model\n\nStartup model.\n",
    ),
    writeFile(
      path.join(singlepageRoot, "products.yaml"),
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: framework-product, name: Framework product }\n",
    ),
    writeFile(
      path.join(startupRoot, "products.yaml"),
      "schema: singlepagestartup.product-catalog.v1\nproducts: []\n",
    ),
  ]);
  for (const omitted of options.omit ?? [])
    await rm(path.join(workspaceRoot, omitted));
  return { singlepageRoot, startupRoot, workspaceRoot };
}

async function expectFailure(
  name: string,
  build: (root: string) => Promise<ReturnType<typeof writeFixture>>,
) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-invalid-"),
  );
  try {
    const fixture = await build(root);
    try {
      await loadWorkspace({
        ...fixture,
        activeLayer: "startup",
        repositoryRoot: root,
      });
      throw new Error(`${name}: invalid fixture was accepted`);
    } catch (error) {
      if (!(error instanceof WorkspaceValidationError)) throw error;
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function runSelfCheck() {
  const validRoot = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-valid-"),
  );
  try {
    const fixture = await writeFixture(validRoot);
    const graph = await loadWorkspace({
      ...fixture,
      activeLayer: "startup",
      repositoryRoot: validRoot,
    });
    const ids = graph.visibleEntries.map((entry) => entry.id);
    if (
      ids.includes("singlepage.secret") ||
      !ids.includes("template.base") ||
      !ids.includes("startup.brief")
    ) {
      throw new Error(
        `valid fixture exposed an invalid inheritance set: ${ids.join(", ")}`,
      );
    }
    const effectiveBrief = graph.loadedEntries.find(
      (entry) => entry.id === "startup.brief",
    );
    if (
      effectiveBrief?.resolution !== "merged" ||
      !effectiveBrief.content.includes("Framework direction.") ||
      !effectiveBrief.content.includes("Client override.") ||
      effectiveBrief.content.includes("Framework default.")
    ) {
      throw new Error(
        "valid fixture did not resolve the startup brief overlay",
      );
    }
    const effectiveDiscovery = graph.loadedEntries.find(
      (entry) => entry.id === "startup.discovery",
    );
    if (
      effectiveDiscovery?.resolution !== "merged" ||
      !effectiveDiscovery.content.includes("Client finding.") ||
      effectiveDiscovery.content.includes("Framework question.") ||
      effectiveDiscovery.content.includes("Framework finding.")
    ) {
      throw new Error(
        "valid fixture did not resolve project-specific knowledge by active layer",
      );
    }
    const effectiveBrand = graph.loadedEntries.find(
      (entry) => entry.id === "startup.brand",
    );
    const effectiveProducts = graph.loadedEntries.find(
      (entry) => entry.id === "startup.products",
    );
    if (
      !effectiveBrand?.uses.includes("startup.brief") ||
      effectiveBrand.uses.includes("singlepage.secret")
    ) {
      throw new Error(
        "valid fixture did not route Brand directly to the resolved Brief",
      );
    }
    if (
      effectiveProducts?.resolution !== "inherited" ||
      !effectiveProducts.content.includes("framework-product")
    ) {
      throw new Error(
        "valid fixture did not inherit an empty startup product catalog",
      );
    }
    const sourceGraph = await loadWorkspace({
      ...fixture,
      activeLayer: "startup",
      projection: "source",
      repositoryRoot: validRoot,
    });
    const sourceBrief = sourceGraph.loadedEntries.find(
      (entry) => entry.id === "startup.brief",
    );
    if (
      sourceBrief?.resolution !== "local" ||
      !sourceBrief.content.includes("Client override.") ||
      sourceBrief.content.includes("Framework direction.") ||
      sourceGraph.visibleEntries.some(
        (entry) => entry.id === "singlepage.secret",
      )
    ) {
      throw new Error(
        "valid fixture did not isolate the startup source projection",
      );
    }
  } finally {
    await rm(validRoot, { recursive: true, force: true });
  }

  const emptyOverlayRoot = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-empty-overlay-"),
  );
  try {
    const fixture = await writeFixture(emptyOverlayRoot);
    await Promise.all([
      writeFile(path.join(fixture.startupRoot, "brief.md"), ""),
      writeFile(path.join(fixture.startupRoot, "discovery.md"), ""),
    ]);
    const [resolvedGraph, sourceGraph] = await Promise.all([
      loadWorkspace({
        ...fixture,
        activeLayer: "startup",
        repositoryRoot: emptyOverlayRoot,
      }),
      loadWorkspace({
        ...fixture,
        activeLayer: "startup",
        projection: "source",
        repositoryRoot: emptyOverlayRoot,
      }),
    ]);
    const resolvedBrief = resolvedGraph.loadedEntries.find(
      (entry) => entry.kind === "brief",
    );
    const startupBrief = sourceGraph.loadedEntries.find(
      (entry) => entry.id === "startup.brief",
    );
    const resolvedDiscovery = resolvedGraph.loadedEntries.find(
      (entry) => entry.id === "startup.discovery",
    );
    if (
      resolvedBrief?.resolution !== "inherited" ||
      !resolvedBrief.content.includes("Framework direction.") ||
      startupBrief?.resolution !== "local" ||
      startupBrief.content !== "" ||
      resolvedDiscovery?.resolution !== "inherited" ||
      !resolvedDiscovery.content.includes("Framework question.")
    ) {
      throw new Error(
        "valid fixture did not pass SinglePageStartup through an empty startup overlay",
      );
    }
  } finally {
    await rm(emptyOverlayRoot, { recursive: true, force: true });
  }

  const productReplacementRoot = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-product-catalog-"),
  );
  try {
    const fixture = await writeFixture(productReplacementRoot);
    await writeFile(
      path.join(fixture.startupRoot, "products.yaml"),
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: startup-product, name: Startup product }\n",
    );
    const graph = await loadWorkspace({
      ...fixture,
      activeLayer: "startup",
      repositoryRoot: productReplacementRoot,
    });
    const products = graph.loadedEntries.find(
      (entry) => entry.id === "startup.products",
    );
    if (
      products?.resolution !== "merged" ||
      !products.content.includes("startup-product") ||
      products.content.includes("framework-product")
    ) {
      throw new Error(
        "valid fixture mixed singlepage and startup product catalogs",
      );
    }
  } finally {
    await rm(productReplacementRoot, { recursive: true, force: true });
  }

  const fallbackRoot = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-fallback-"),
  );
  try {
    const fixture = await writeFixture(fallbackRoot, {
      startupIndex:
        "schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.discovery, kind: discovery, path: startup/discovery.md, extends: singlepage.discovery, strategy: replace, description: Local discovery., uses: [] }\nexports: []\nimports: [template.base]\n",
    });
    const graph = await loadWorkspace({
      ...fixture,
      activeLayer: "startup",
      repositoryRoot: fallbackRoot,
    });
    const inheritedBrief = graph.loadedEntries.find(
      (entry) => entry.kind === "brief",
    );
    if (
      inheritedBrief?.id !== "singlepage.secret" ||
      inheritedBrief.resolution !== "inherited" ||
      !inheritedBrief.content.includes("Framework direction.")
    ) {
      throw new Error(
        "valid fixture did not fall back to the SinglePageStartup brief",
      );
    }
  } finally {
    await rm(fallbackRoot, { recursive: true, force: true });
  }

  await expectFailure("duplicate ID", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: template.base, kind: brief, path: brief.md, description: Duplicate., uses: [] }\nexports: []\nimports: [template.base]\n`,
    }),
  );
  await expectFailure("missing file", async (root) =>
    writeFixture(root, { omit: ["startup/brief.md"] }),
  );
  await expectFailure("missing extends", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: startup/brief.md, strategy: sections, description: Local., uses: [] }\nexports: []\nimports: []\n`,
    }),
  );
  await expectFailure("wrong strategy", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: startup/brief.md, extends: singlepage.secret, strategy: replace, description: Local., uses: [] }\nexports: []\nimports: []\n`,
    }),
  );
  await expectFailure("invalid import", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: brief.md, description: Local., uses: [template.missing] }\nexports: []\nimports: [template.missing]\n`,
    }),
  );
  await expectFailure("broken uses", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: brief.md, description: Local., uses: [startup.missing] }\nexports: []\nimports: []\n`,
    }),
  );
  await expectFailure("cycle", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: brief.md, description: Local., uses: [startup.other] }\n  - { id: startup.other, kind: research, path: other.md, description: Other., uses: [startup.brief] }\nexports: []\nimports: []\n`,
    }).then(async (fixture) => {
      await writeFile(path.join(fixture.startupRoot, "other.md"), "# Other\n");
      return fixture;
    }),
  );
  console.log(
    "Workspace validator self-check resolved declared section, replacement, keyed, and atomic product-catalog strategy; routed active dependencies; passed empty startup files through; isolated source projections and fallbacks; then rejected invalid inheritance, IDs, files, imports, uses, and cycles.",
  );
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const graph = await loadWorkspace({
    activeLayer: options.activeLayer,
    repositoryIdentity: options.repositoryIdentity,
    workspaceRoot: options.workspaceRoot,
  });
  await validateDesignLayouts(graph.workspaceRoot);
  for (const entry of graph.loadedEntries.filter(
    (entry) => entry.kind === "products",
  )) {
    const catalog = parseProductCatalog(
      entry.content,
      entry.inherited ? "singlepage" : graph.activeLayer,
    );
    await validateProductCatalogFiles(
      catalog,
      path.dirname(entry.absolutePath),
    );
    await validateProductSectionFiles(
      catalog,
      path.dirname(entry.absolutePath),
    );
  }
  console.log(
    `Workspace ${graph.activeLayer} is valid: ${graph.visibleEntries.length} visible entries, ${graph.imports.length} imports, ${graph.exports.length} exports.`,
  );
  if (options.selfCheck) await runSelfCheck();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
