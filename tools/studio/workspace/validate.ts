import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
  const indexRoot = path.join(workspaceRoot, "index");
  const singlepageRoot = path.join(workspaceRoot, "singlepage");
  const startupRoot = path.join(workspaceRoot, "startup");
  await Promise.all([
    mkdir(indexRoot, { recursive: true }),
    mkdir(singlepageRoot, { recursive: true }),
    mkdir(startupRoot, { recursive: true }),
  ]);
  const singlepageIndex =
    options.singlepageIndex ??
    `schema: fixture.v1\nlayer: singlepage\nentries:\n  - { id: template.base, kind: template, path: singlepage/base.md, description: Exported template., uses: [] }\n  - { id: singlepage.discovery, kind: discovery, path: singlepage/discovery.md, description: Framework discovery., uses: [] }\n  - { id: singlepage.secret, kind: brief, path: singlepage/secret.md, description: Private local artifact., uses: [singlepage.discovery] }\n  - { id: singlepage.evidence, kind: evidence, path: singlepage/evidence.md, description: Framework evidence., uses: [] }\n  - { id: singlepage.profile, kind: decision-profile, path: singlepage/profile.md, description: Framework profile., uses: [singlepage.secret, singlepage.evidence] }\n  - { id: singlepage.business, kind: business, path: singlepage/business.md, description: Framework business., uses: [singlepage.profile] }\nexports: [template.base]\nimports: []\n`;
  const startupIndex =
    options.startupIndex ??
    `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.discovery, kind: discovery, path: startup/discovery.md, extends: singlepage.discovery, strategy: replace, description: Client discovery., uses: [] }\n  - { id: startup.brief, kind: brief, path: startup/brief.md, extends: singlepage.secret, strategy: sections, description: Local startup artifact., uses: [template.base, startup.discovery] }\n  - { id: startup.evidence, kind: evidence, path: startup/evidence.md, extends: singlepage.evidence, strategy: scoped-keyed, description: Client evidence., uses: [] }\n  - { id: startup.profile, kind: decision-profile, path: startup/profile.md, extends: singlepage.profile, strategy: replace, description: Client profile., uses: [startup.brief, startup.evidence] }\n  - { id: startup.business, kind: business, path: startup/business.md, extends: singlepage.business, strategy: sections, description: Client business., uses: [startup.profile] }\nexports: []\nimports: [template.base]\n`;
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
      path.join(singlepageRoot, "evidence.md"),
      "# Evidence register\n\n| ID | Scope | State | Claim |\n| --- | --- | --- | --- |\n| E-1 | singlepage | active | Framework fact |\n| E-2 | singlepage | active | Framework assumption |\n",
    ),
    writeFile(
      path.join(startupRoot, "evidence.md"),
      "# Evidence register\n\n| ID | Scope | State | Claim |\n| --- | --- | --- | --- |\n| E-2 | startup | superseded | Client correction |\n| E-3 | startup | active | Client fact |\n",
    ),
    writeFile(
      path.join(singlepageRoot, "profile.md"),
      "# Decision profile\n\n## Business model\n\nFramework business model.\n\n## Capacity\n\nFramework capacity rule.\n",
    ),
    writeFile(
      path.join(startupRoot, "profile.md"),
      "# Decision profile\n\n## Business model\n\nStartup business model.\n\n## Capacity\n",
    ),
    writeFile(
      path.join(singlepageRoot, "business.md"),
      "# Business\n\n## Model\n\nFramework model.\n",
    ),
    writeFile(
      path.join(startupRoot, "business.md"),
      "# Business\n\n## Model\n\nStartup model.\n",
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
    const effectiveEvidence = graph.loadedEntries.find(
      (entry) => entry.id === "startup.evidence",
    );
    if (
      effectiveEvidence?.resolution !== "merged" ||
      !effectiveEvidence.content.includes("Framework fact") ||
      !effectiveEvidence.content.includes("Client correction") ||
      !effectiveEvidence.content.includes("Client fact") ||
      effectiveEvidence.content.includes("Framework assumption")
    ) {
      throw new Error(
        "valid fixture did not resolve evidence rows by stable ID",
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
    const effectiveProfile = graph.loadedEntries.find(
      (entry) => entry.id === "startup.profile",
    );
    const effectiveBusiness = graph.loadedEntries.find(
      (entry) => entry.id === "startup.business",
    );
    if (
      effectiveProfile?.resolution !== "merged" ||
      !effectiveProfile.content.includes("Startup business model.") ||
      effectiveProfile.content.includes("Framework capacity rule.") ||
      effectiveProfile.content.includes("Framework business model.") ||
      graph.visibleEntries.some((entry) => entry.id === "singlepage.profile") ||
      !effectiveBusiness?.uses.includes("startup.profile") ||
      effectiveBusiness.uses.includes("singlepage.profile")
    ) {
      throw new Error(
        "valid fixture did not resolve the decision-profile overlay or route dependencies to it",
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
      writeFile(path.join(fixture.startupRoot, "evidence.md"), ""),
      writeFile(path.join(fixture.startupRoot, "discovery.md"), ""),
      writeFile(path.join(fixture.startupRoot, "profile.md"), ""),
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
    const resolvedProfile = resolvedGraph.loadedEntries.find(
      (entry) => entry.id === "startup.profile",
    );
    if (
      resolvedBrief?.resolution !== "inherited" ||
      !resolvedBrief.content.includes("Framework direction.") ||
      startupBrief?.resolution !== "local" ||
      startupBrief.content !== "" ||
      resolvedDiscovery?.resolution !== "inherited" ||
      !resolvedDiscovery.content.includes("Framework question.") ||
      resolvedProfile?.resolution !== "inherited" ||
      !resolvedProfile.content.includes("Framework business model.")
    ) {
      throw new Error(
        "valid fixture did not pass SinglePageStartup through an empty startup overlay",
      );
    }
  } finally {
    await rm(emptyOverlayRoot, { recursive: true, force: true });
  }

  const fallbackRoot = await mkdtemp(
    path.join(os.tmpdir(), "singlepagestartup-workspace-fallback-"),
  );
  try {
    const fixture = await writeFixture(fallbackRoot, {
      startupIndex:
        "schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.profile, kind: decision-profile, path: startup/profile.md, extends: singlepage.profile, strategy: replace, description: Local profile., uses: [] }\nexports: []\nimports: [template.base]\n",
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
  await expectFailure("invalid evidence scope", async (root) =>
    writeFixture(root).then(async (fixture) => {
      await writeFile(
        path.join(fixture.startupRoot, "evidence.md"),
        "# Evidence register\n\n| ID | Scope | State | Claim |\n| --- | --- | --- | --- |\n| E-3 | singlepage | active | Wrong scope |\n",
      );
      return fixture;
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
    "Workspace validator self-check resolved declared section, replacement, keyed, and scoped evidence strategies; routed active dependencies; passed empty startup files through; isolated source projections and fallbacks; then rejected invalid inheritance, evidence scope, IDs, files, imports, uses, and cycles.",
  );
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const graph = await loadWorkspace({
    activeLayer: options.activeLayer,
    repositoryIdentity: options.repositoryIdentity,
    workspaceRoot: options.workspaceRoot,
  });
  console.log(
    `Workspace ${graph.activeLayer} is valid: ${graph.visibleEntries.length} visible entries, ${graph.imports.length} imports, ${graph.exports.length} exports.`,
  );
  if (options.selfCheck) await runSelfCheck();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
