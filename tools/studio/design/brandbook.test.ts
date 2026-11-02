/**
 * BDD Suite: Downstream brandbook ownership
 * Given a downstream project inherits the framework's visual system until it writes its own
 * When the workspace is validated at or after 30-design
 * Then the project must own its Design decisions and and its assets
 */

import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { findUnownedBrandbook, validateOwnedBrandbook } from "./brandbook";

async function workspace(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "sps-brandbook-"));
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return root;
}

const atDesign = `schema: singlepagestartup.pre-development-state.v2
active_section: design
status: in_progress
active_artifacts:
  - design
blockers: []
`;

const atBusiness = `schema: singlepagestartup.pre-development-state.v2
active_section: brief
status: not_started
active_artifacts:
  - brief
blockers: []
`;

describe("downstream brandbook", () => {
  /**
   * BDD Scenario: Leave the framework's own layers alone
   * Given the repository is the framework itself
   * When the workspace resolves as singlepage
   * Then an empty startup layer is the intended base rather than a failure
   */
  test("never asks the framework layer to own a downstream brandbook", async () => {
    const root = await workspace({
      "utils/pre-development/startup.yaml": atDesign,
      "design/startup.md": "",
      "assets/startup.yaml": "",
    });

    expect(await findUnownedBrandbook(root, "singlepage")).toEqual([]);
  });

  /**
   * BDD Scenario: Inheritance is legitimate before the design stage
   * Given a downstream project has not reached 30-design
   * When the workspace is validated
   * Then inheriting the framework's visual system raises nothing
   */
  test("allows inheritance while the project is before 30-design", async () => {
    const root = await workspace({
      "utils/pre-development/startup.yaml": atBusiness,
      "design/startup.md": "",
      "assets/startup.yaml": "",
    });

    expect(await findUnownedBrandbook(root, "startup")).toEqual([]);
  });

  /**
   * BDD Scenario: Catch a project shipping the framework's brandbook as its own
   * Given a downstream project reached 30-design with empty design and asset layers
   * When the workspace is validated
   * Then it reports the missing document and the missing asset registry
   */
  test("reports an empty downstream Design and asset registry at 30-design", async () => {
    const root = await workspace({
      "utils/pre-development/startup.yaml": atDesign,
      "design/startup.md": "",
      "assets/startup.yaml": "",
    });

    const findings = await findUnownedBrandbook(root, "startup");

    expect(findings.map(({ requirement }) => requirement)).toEqual([
      "design/startup.md carries this project's own decisions",
      "assets/startup.yaml registers this project's own assets",
    ]);
    await expect(validateOwnedBrandbook(root, "startup")).rejects.toThrow(
      "does not own its brandbook",
    );
  });

  /**
   * BDD Scenario: Headings alone are not a decision
   * Given a downstream Design contains only its template headings
   * When the workspace is validated
   * Then the document still counts as unwritten
   */
  test("treats a headings-only Design as unwritten", async () => {
    const root = await workspace({
      "utils/pre-development/startup.yaml": atDesign,
      "design/startup.md": "# Design\n\n## Visual system\n\n<!-- todo -->\n",
      "assets/startup.yaml": "assets:\n  - id: startup-font\n",
    });

    expect(
      (await findUnownedBrandbook(root, "startup")).map(
        ({ requirement }) => requirement,
      ),
    ).toEqual(["design/startup.md carries this project's own decisions"]);
  });

  test("accepts owned Design and assets without approval metadata", async () => {
    const root = await workspace({
      "utils/pre-development/startup.yaml": atDesign,
      "design/startup.md": "# Design\n\nOur own canvas and accent.\n",
      "assets/startup.yaml": "assets:\n  - id: startup-font\n",
    });
    expect(await findUnownedBrandbook(root, "startup")).toEqual([]);
    await expect(
      validateOwnedBrandbook(root, "startup"),
    ).resolves.toBeUndefined();
  });
});
