/**
 * BDD Suite: Required Design specimens
 * Given Design ships rendered specimens rather than rules alone
 * When a layer documents an interface language
 * Then the specimens that prove it must exist in the layout that actually renders
 */

import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  findMissingSpecimens,
  findSpecimenDeviations,
  requiredSpecimens,
  validateRequiredSpecimens,
} from "./specimens";

const everySpecimen = [...Object.keys(requiredSpecimens), "dark-pair"];

function kit(ids: string[]): string {
  return ids
    .map((id) => `<article data-specimen="${id}"><p>Specimen</p></article>`)
    .join("\n");
}

const darkColumn = `
### Semantic color system

| Role   | Light     | Dark      | Usage         |
| ------ | --------- | --------- | ------------- |
| Canvas | \`#F7F6F2\` | \`#111111\` | Primary field |
`;

const lightOnly = `
### Semantic color system

| Role   | Light     | Usage         |
| ------ | --------- | ------------- |
| Canvas | \`#F7F6F2\` | Primary field |
`;

function design(body: string, frontmatter = ""): string {
  const head = frontmatter ? `---\n${frontmatter}\n---\n\n` : "";
  return `${head}# Design\n${body}\n## Interface and product surfaces\n\nRules.\n`;
}

async function workspace(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "sps-specimens-"));
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return root;
}

const layout = `sections:
  - { id: colors, builtin: colors }
  - id: kit
    title: Interface kit
    source: kit.html
`;

describe("required Design specimens", () => {
  /**
   * BDD Scenario: Accept a complete kit
   * Given every required specimen declares itself in a rendered section
   * When the workspace is validated
   * Then nothing is reported
   */
  test("accepts a layout that renders every required specimen", async () => {
    const root = await workspace({
      "design/singlepage.md": design(darkColumn),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": kit(everySpecimen),
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });

    expect(await findMissingSpecimens(root)).toEqual([]);
    await expect(validateRequiredSpecimens(root)).resolves.toBeUndefined();
  });

  /**
   * BDD Scenario: Catch an interface language with no proof
   * Given Design documents interface rules but renders no specimen
   * When the workspace is validated
   * Then every required specimen is reported and validation fails
   */
  test("reports each missing specimen and fails validation", async () => {
    const root = await workspace({
      "design/singlepage.md": design(lightOnly),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": "<p>No specimens here.</p>",
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });

    const findings = await findMissingSpecimens(root);

    expect(findings).toHaveLength(Object.keys(requiredSpecimens).length);
    expect(findings[0].requirement).toContain("actions");
    await expect(validateRequiredSpecimens(root)).rejects.toThrow(
      "without the specimens that prove it",
    );
  });

  /**
   * BDD Scenario: Leave a project without an interface language alone
   * Given Design never documents an interface section
   * When the workspace is validated
   * Then no specimen is owed
   */
  test("owes nothing when Design documents no interface language", async () => {
    const root = await workspace({
      "design/singlepage.md": "# Design\n\n## Photography\n\nRules.\n",
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": "<p>Unrelated.</p>",
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });

    expect(await findMissingSpecimens(root)).toEqual([]);
  });

  /**
   * BDD Scenario: Owe the dark pair only when a dark column exists
   * Given a colour system without a Dark column
   * When the workspace is validated
   * Then the dark pair is not required while the rest still is
   */
  test("requires the dark pair only when the colour system declares one", async () => {
    const withoutDark = await workspace({
      "design/singlepage.md": design(lightOnly),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": kit(Object.keys(requiredSpecimens)),
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });
    const withDark = await workspace({
      "design/singlepage.md": design(darkColumn),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": kit(Object.keys(requiredSpecimens)),
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });

    expect(await findMissingSpecimens(withoutDark)).toEqual([]);
    expect(
      (await findMissingSpecimens(withDark)).map(
        ({ requirement }) => requirement,
      ),
    ).toEqual(["Design declares a `dark-pair` specimen"]);
  });

  /**
   * BDD Scenario: Allow an attributed omission
   * Given a specimen is recorded as out of scope with its reason
   * When the workspace is validated
   * Then that specimen is not owed while an unexplained one still is
   */
  test("accepts an omission that carries a reason and rejects a bare one", async () => {
    const files = (frontmatter: string) => ({
      "design/singlepage.md": design(lightOnly, frontmatter),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": kit(
        Object.keys(requiredSpecimens).filter((id) => id !== "item-grid"),
      ),
      "design/startup.md": "",
      "design/startup/layout.yaml": "{}",
    });
    const explained = await workspace(
      files(
        "interface_review:\n  omitted_specimens:\n    item-grid: This product lists nothing repeatable.",
      ),
    );
    const bare = await workspace(
      files("interface_review:\n  omitted_specimens:\n    item-grid: ''"),
    );

    expect(await findMissingSpecimens(explained)).toEqual([]);
    expect(
      (await findMissingSpecimens(bare)).map(({ requirement }) => requirement),
    ).toEqual(["Design declares a `item-grid` specimen"]);
  });

  /**
   * BDD Scenario: Read the layout that actually renders
   * Given a startup layout replaces the base and omits the kit section
   * When the workspace is validated
   * Then the base specimens no longer count because they are not rendered
   */
  test("counts only specimens reachable through the resolved layout", async () => {
    const root = await workspace({
      "design/singlepage.md": design(lightOnly),
      "design/singlepage/layout.yaml": layout,
      "design/singlepage/kit.html": kit(Object.keys(requiredSpecimens)),
      "design/startup.md": "",
      "design/startup/layout.yaml":
        "sections:\n  - { id: colors, builtin: colors }\n",
    });

    expect(await findMissingSpecimens(root)).toHaveLength(
      Object.keys(requiredSpecimens).length,
    );
  });
});

/**
 * BDD Suite: The framework owns the wrapper
 * Given a project restyles a block rather than renaming or inventing one
 * When its Design layout and kit are inspected
 * Then any renamed section, translated specimen heading or unknown block is reported
 */
describe("specimen catalogue", () => {
  const frameworkLayout = `sections:
  - id: interface-kit
    title: Interface kit
    source: kit.html
`;

  function projectLayout(title: string): string {
    return `sections:
  - id: interface-kit
    title: ${title}
    source: kit.html
`;
  }

  function article(id: string, heading: string): string {
    return `<article data-specimen="${id}"><h3>${heading}</h3><p>Body</p></article>`;
  }

  const frameworkFiles = {
    "design/singlepage/layout.yaml": frameworkLayout,
    "design/singlepage/kit.html": article("actions", "Actions"),
  };

  /**
   * BDD Scenario: A project that only restyles its blocks
   * Given a kit whose section and specimen keep the framework names
   * When the workspace is inspected
   * Then nothing is reported however different the content is
   */
  test("accepts a project that keeps every framework name", async () => {
    const root = await workspace({
      ...frameworkFiles,
      "design/startup/layout.yaml": projectLayout("Interface kit"),
      "design/startup/kit.html": `<article data-specimen="actions"><h3>Actions</h3><p>Совсем другая подача</p></article>`,
    });

    expect(await findSpecimenDeviations(root)).toEqual([]);
  });

  /**
   * BDD Scenario: A section renamed downstream
   * Given a project layout that translates the section title
   * When the workspace is inspected
   * Then the renamed section is reported with both names
   */
  test("reports a section the project renamed", async () => {
    const root = await workspace({
      ...frameworkFiles,
      "design/startup/layout.yaml": projectLayout("Интерфейсный набор"),
      "design/startup/kit.html": article("actions", "Actions"),
    });

    const findings = await findSpecimenDeviations(root);

    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toContain("Интерфейсный набор");
    expect(findings[0].detail).toContain("Interface kit");
  });

  /**
   * BDD Scenario: A specimen heading translated downstream
   * Given a kit that heads a catalogued block with its own wording
   * When the workspace is inspected
   * Then the heading is reported against the framework title
   */
  test("reports a specimen the project renamed", async () => {
    const root = await workspace({
      ...frameworkFiles,
      "design/startup/layout.yaml": projectLayout("Interface kit"),
      "design/startup/kit.html": article("actions", "Ступени действия"),
    });

    const findings = await findSpecimenDeviations(root);

    expect(findings).toHaveLength(1);
    expect(findings[0].requirement).toContain("actions");
    expect(findings[0].detail).toContain("Ступени действия");
  });

  /**
   * BDD Scenario: A block that exists in no layer of the framework
   * Given a kit that declares a specimen the catalogue never defines
   * When the workspace is inspected
   * Then the invented block is reported instead of silently shipping
   */
  test("reports a specimen the catalogue does not define", async () => {
    const root = await workspace({
      ...frameworkFiles,
      "design/startup/layout.yaml": projectLayout("Interface kit"),
      "design/startup/kit.html": `${article("actions", "Actions")}\n${article("pricing-ladder", "Pricing ladder")}`,
    });

    const findings = await findSpecimenDeviations(root);

    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toContain("pricing-ladder");
  });

  /**
   * BDD Scenario: The framework layer itself
   * Given a workspace where no project layer owns a Design layout
   * When it is inspected
   * Then the framework owes nothing to itself
   */
  test("owes nothing when only the framework layer has a layout", async () => {
    const root = await workspace({
      ...frameworkFiles,
      "design/startup/layout.yaml": "{}",
    });

    expect(await findSpecimenDeviations(root)).toEqual([]);
  });
});
