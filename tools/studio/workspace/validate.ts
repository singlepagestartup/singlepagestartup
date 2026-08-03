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
  const singlepageRoot = path.join(workspaceRoot, "singlepage");
  const startupRoot = path.join(workspaceRoot, "startup");
  await Promise.all([
    mkdir(singlepageRoot, { recursive: true }),
    mkdir(startupRoot, { recursive: true }),
  ]);
  const singlepageIndex =
    options.singlepageIndex ??
    `schema: fixture.v1\nlayer: singlepage\nentries:\n  - { id: template.base, kind: template, path: base.md, description: Exported template., uses: [] }\n  - { id: singlepage.secret, kind: brief, path: secret.md, description: Private local artifact., uses: [] }\nexports: [template.base]\nimports: []\n`;
  const startupIndex =
    options.startupIndex ??
    `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: startup.brief, kind: brief, path: brief.md, description: Local startup artifact., uses: [template.base] }\nexports: []\nimports: [template.base]\n`;
  await Promise.all([
    writeFile(path.join(singlepageRoot, "index.yaml"), singlepageIndex),
    writeFile(path.join(startupRoot, "index.yaml"), startupIndex),
    writeFile(path.join(singlepageRoot, "base.md"), "# Base\n"),
    writeFile(path.join(singlepageRoot, "secret.md"), "# Secret\n"),
    writeFile(path.join(startupRoot, "brief.md"), "# Brief\n"),
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
  } finally {
    await rm(validRoot, { recursive: true, force: true });
  }

  await expectFailure("duplicate ID", async (root) =>
    writeFixture(root, {
      startupIndex: `schema: fixture.v1\nlayer: startup\nentries:\n  - { id: template.base, kind: brief, path: brief.md, description: Duplicate., uses: [] }\nexports: []\nimports: [template.base]\n`,
    }),
  );
  await expectFailure("missing file", async (root) =>
    writeFixture(root, { omit: ["startup/brief.md"] }),
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
    "Workspace validator self-check rejected duplicate IDs, missing files, invalid imports, broken uses, and cycles.",
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
