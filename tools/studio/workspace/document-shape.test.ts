/**
 * BDD Suite: The shape a document has to hold
 * Given the framework names every inherited section and the commit hook formats Markdown
 * When a layer's document is inspected
 * Then a renamed heading and a body the hook would still rewrite are both reported
 */

import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  documentHeadings,
  findTranslatedHeadings,
  findUnformattedDocuments,
} from "./document-shape";

const framework = `# Design

## Design intent

### Brand idea and character

## Visual system
`;

function project(body: string): string {
  return body;
}

describe("inherited headings", () => {
  /**
   * BDD Scenario: Headings read with their level
   * Given a document with headings of several levels
   * When they are collected
   * Then each keeps the level that distinguishes it from a same-named sibling
   */
  test("collects every heading with its level", () => {
    expect(documentHeadings(framework)).toEqual([
      "# Design",
      "## Design intent",
      "### Brand idea and character",
      "## Visual system",
    ]);
  });

  /**
   * BDD Scenario: A translated title
   * Given a project that writes its own title in another language
   * When the document is compared with the framework
   * Then the inherited title is reported as missing
   */
  test("reports a title the project translated", () => {
    const findings = findTranslatedHeadings({
      framework,
      project: project(
        "# Дизайн\n\n## Design intent\n\n### Brand idea and character\n\n## Visual system\n",
      ),
      projectPath: "design/startup.md",
    });

    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toContain("# Design");
  });

  /**
   * BDD Scenario: Sections the business asked for
   * Given a project keeps every inherited heading and adds two of its own
   * When the document is compared with the framework
   * Then the additions are accepted
   */
  test("accepts sections a project adds beyond the inherited ones", () => {
    expect(
      findTranslatedHeadings({
        framework,
        project: project(
          "# Design\n\n## Design intent\n\n### Brand idea and character\n\n## Visual system\n\n## Interface kit\n\n### Numbered steps\n",
        ),
        projectPath: "design/startup.md",
      }),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: A layer that has written nothing yet
   * Given the project inherits the framework document whole
   * When the empty layer is compared
   * Then inheritance is the starting state rather than a finding
   */
  test("owes nothing while the layer is still empty", () => {
    expect(
      findTranslatedHeadings({
        framework,
        project: "   \n",
        projectPath: "design/startup.md",
      }),
    ).toEqual([]);
  });
});

describe("committed form", () => {
  const file = path.join(tmpdir(), "sps-document-shape.md");

  /**
   * BDD Scenario: A body the commit hook would still rewrite
   * Given Markdown that the formatter normalises
   * When the document is inspected
   * Then it is reported, because a stamp taken now covers a body that stops existing
   */
  test("reports a body the formatter would change", async () => {
    const findings = await findUnformattedDocuments([
      { path: file, source: "#  Title\n\n*   item\n" },
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].detail).toContain("format");
  });

  /**
   * BDD Scenario: A body already in the form the commit produces
   * Given Markdown the formatter leaves untouched
   * When the document is inspected
   * Then nothing is reported
   */
  test("accepts a body already in its committed form", async () => {
    expect(
      await findUnformattedDocuments([
        { path: file, source: "# Title\n\n- item\n" },
      ]),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: A layer file that carries nothing
   * Given an empty document
   * When it is inspected
   * Then there is no body to format
   */
  test("skips an empty document", async () => {
    expect(
      await findUnformattedDocuments([{ path: file, source: "\n" }]),
    ).toEqual([]);
  });
});
