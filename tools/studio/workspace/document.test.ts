/**
 * BDD Suite: Document confirmation across source layers
 * Given a user confirms a particular document body
 * When startup overrides or inherits that body
 * Then only the confirmed text and owning layer retain a valid confirmation
 */
import { afterEach, describe, expect, test } from "bun:test";
import { parse, stringify } from "yaml";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  documentConfirmation,
  documentFingerprint,
  documentReviewBody,
  parseDocument,
  renderDocument,
} from "./document";
import { mergeMarkdown, mergeWorkspaceContent, mergeYaml } from "./merge";
import { loadWorkspace } from "./loader";
import { reviewDocument } from "./document-review";

const body =
  "# Business\n\n## Offer\n\nFree framework.\n\n## Capacity\n\nSix hours.\n";

function confirmed(source: string, resolvedBody = source) {
  return renderDocument({
    body: source,
    metadata: {
      confirmation: {
        confirmed: true,
        by: "operator",
        at: "2026-09-11",
        content_sha256: documentFingerprint(resolvedBody),
      },
    },
  });
}

const fixtureRoots: string[] = [];
afterEach(async () => {
  await Promise.all(
    fixtureRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function workspaceFixture(startup: string) {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "sps-document-confirmation-"),
  );
  fixtureRoots.push(repositoryRoot);
  const workspaceRoot = path.join(repositoryRoot, "apps/studio/workspace");
  for (const directory of ["utils/index", "business"]) {
    await mkdir(path.join(workspaceRoot, directory), { recursive: true });
  }
  for (const layer of ["singlepage", "startup"]) {
    const entries = ["business"].map(
      (kind) =>
        `  - { id: ${layer}.${kind}, kind: ${kind}, path: ${kind}/${layer}.md, description: Review document, uses: []${layer === "startup" ? `, extends: singlepage.${kind}, strategy: sections` : ""} }`,
    );
    await writeFile(
      path.join(workspaceRoot, `utils/index/${layer}.yaml`),
      `schema: fixture.v1\nlayer: ${layer}\nentries:\n${entries.join("\n")}\nexports: []\nimports: []\n`,
    );
  }
  await writeFile(
    path.join(workspaceRoot, "business/singlepage.md"),
    confirmed(body),
  );
  await writeFile(path.join(workspaceRoot, "business/startup.md"), startup);
  return { repositoryRoot, workspaceRoot, activeLayer: "startup" as const };
}

describe("document confirmation", () => {
  /**
   * BDD Scenario: Resolve a partial source in both agent projections
   * Given startup confirms its offer and the inherited capacity together
   * When agents request either the resolved document or the startup source
   * Then both report the same confirmation while source content stays local
   */
  test("keeps loader and review helper aligned on the composed document", async () => {
    const override = "# Business\n\n## Offer\n\nPaid service.";
    const resolved = mergeMarkdown(body, override).content;
    const fixture = await workspaceFixture(confirmed(override, resolved));
    const merged = await loadWorkspace(fixture);
    const source = await loadWorkspace({ ...fixture, projection: "source" });
    const business = merged.loadedEntries.find(
      (entry) => entry.kind === "business",
    )!;
    const startup = source.loadedEntries.find(
      (entry) => entry.kind === "business",
    )!;
    expect(business.confirmation).toMatchObject({
      confirmed: true,
      layer: "startup",
    });
    expect(startup.confirmation).toEqual(business.confirmation);
    expect(business.content).toContain("Six hours.");
    expect(startup.content).not.toContain("Six hours.");
    const review = await reviewDocument(
      "apps/studio/workspace/business/startup.md",
      fixture.repositoryRoot,
    );
    expect(review).toMatchObject({
      confirmation: business.confirmation,
      content_sha256: documentFingerprint(resolved),
    });
  });

  /**
   * BDD Scenario: Review an unchanged local approval after an input changes
   * Given startup confirmed an inherited Strategy against its local Business
   * When that Business changes and agents inspect either projection
   * Then the helper and both projections report stale and identify the dependent
   */
  test("aligns upstream staleness across loader projections and the helper", async () => {
    const fixture = await workspaceFixture(
      "# Business\n\n## Offer\n\nPaid service.",
    );
    const strategyBody = "# Strategy\n\nCurrent commercial decision.";
    await mkdir(path.join(fixture.workspaceRoot, "strategy"));
    for (const layer of ["singlepage", "startup"]) {
      const file = path.join(
        fixture.workspaceRoot,
        `utils/index/${layer}.yaml`,
      );
      const index = parse(await readFile(file, "utf8"));
      index.entries.push({
        id: `${layer}.strategy`,
        kind: "strategy",
        path: `strategy/${layer}.md`,
        description: "Strategy",
        uses: [`${layer}.business`],
        ...(layer === "startup"
          ? { extends: "singlepage.strategy", strategy: "sections" }
          : {}),
      });
      await writeFile(file, stringify(index));
    }
    const effectiveBusiness = mergeMarkdown(
      body,
      "# Business\n\n## Offer\n\nPaid service.",
    ).content;
    const local = parseDocument(confirmed("", strategyBody));
    local.metadata.review = {
      dependencies: { business: documentFingerprint(effectiveBusiness) },
    };
    await writeFile(
      path.join(fixture.workspaceRoot, "strategy/singlepage.md"),
      strategyBody,
    );
    await writeFile(
      path.join(fixture.workspaceRoot, "strategy/startup.md"),
      renderDocument(local),
    );
    expect(
      (await loadWorkspace(fixture)).loadedEntries.find(
        ({ kind }) => kind === "strategy",
      )!.confirmation.state,
    ).toBe("confirmed");
    await writeFile(
      path.join(fixture.workspaceRoot, "business/startup.md"),
      "# Business\n\n## Offer\n\nChanged service.",
    );
    const resolved = (await loadWorkspace(fixture)).loadedEntries.find(
      ({ kind }) => kind === "strategy",
    )!;
    const source = (
      await loadWorkspace({ ...fixture, projection: "source" })
    ).loadedEntries.find(({ kind }) => kind === "strategy")!;
    const helper = await reviewDocument(
      "apps/studio/workspace/strategy/startup.md",
      fixture.repositoryRoot,
    );
    expect(resolved.confirmation).toMatchObject({
      state: "stale",
      layer: "startup",
      sources: ["business"],
    });
    expect(source.confirmation).toEqual(resolved.confirmation);
    expect(helper.confirmation).toEqual(resolved.confirmation);
    expect(helper.content_sha256).toBe(documentFingerprint(strategyBody));
    const impact = await reviewDocument(
      "apps/studio/workspace/business/startup.md",
      fixture.repositoryRoot,
    );
    expect(impact.dependents).toContainEqual({
      id: "strategy",
      path: "strategy/startup.md",
      state: "stale",
    });
  });

  /**
   * BDD Scenario: Inherit an unchanged confirmed source
   * Given singlepage was confirmed and startup has no override
   * When the layers resolve
   * Then the confirmation stays attributed to singlepage
   */
  test("inherits confirmation with unchanged content", () => {
    const merged = mergeMarkdown(confirmed(body), "");
    expect(merged.overlayContributes).toBe(false);
    expect(
      documentConfirmation(merged.content, merged.confirmationLayer!),
    ).toMatchObject({ confirmed: true, layer: "singlepage" });
  });

  /**
   * BDD Scenario: Change part of an approved source
   * Given startup overrides only the offer
   * When the document resolves
   * Then the retained capacity does not transfer approval to the new offer
   */
  test("requires confirmation for a partial override", () => {
    const merged = mergeMarkdown(
      confirmed(body),
      "# Business\n\n## Offer\n\nPaid service.",
    );
    expect(merged.content).toContain("Six hours.");
    expect(merged.content).toContain("Paid service.");
    expect(
      documentConfirmation(merged.content, merged.confirmationLayer!),
    ).toMatchObject({ confirmed: false, layer: "startup" });
  });

  /**
   * BDD Scenario: Revoke an inherited confirmation without copying the body
   * Given startup explicitly records confirmed false
   * When the body is inherited
   * Then that false value wins over the base approval
   */
  test("honors an explicit metadata-only rejection", () => {
    const merged = mergeMarkdown(
      confirmed(body),
      "---\nconfirmation:\n  confirmed: false\n---\n",
    );
    expect(parseDocument(merged.content).body.trim()).toBe(body.trim());
    expect(
      documentConfirmation(merged.content, merged.confirmationLayer!),
    ).toMatchObject({ confirmed: false, layer: "startup" });
  });

  /**
   * BDD Scenario: Confirm a composed document
   * Given the operator has reviewed the retained base sections and the startup override together
   * When startup records the composed text fingerprint
   * Then its own confirmation is valid until a contributing section changes
   */
  test("binds startup confirmation to the complete resolved body", () => {
    const override = "# Business\n\n## Offer\n\nPaid service.";
    const resolved = mergeMarkdown(body, override).content;
    const startup = confirmed(override, resolved);
    const merged = mergeMarkdown(confirmed(body), startup);
    expect(
      documentConfirmation(merged.content, merged.confirmationLayer!),
    ).toMatchObject({ confirmed: true, layer: "startup" });
    const changed = mergeMarkdown(
      confirmed(body.replace("Six hours.", "Two hours.")),
      startup,
    );
    expect(
      documentConfirmation(changed.content, changed.confirmationLayer!),
    ).toMatchObject({ confirmed: false, state: "changed" });
  });

  /**
   * BDD Scenario: Adopt the complete base for the startup project
   * Given startup explicitly confirms inherited text without copying it
   * When only confirmation metadata is present in startup
   * Then the composed review is confirmed by startup
   */
  test("allows explicit confirmation of inherited text", () => {
    const merged = mergeMarkdown(body, confirmed("", body));
    expect(
      documentConfirmation(merged.content, merged.confirmationLayer!),
    ).toMatchObject({ confirmed: true, layer: "startup" });
  });

  /**
   * BDD Scenario: Preserve a confirmation when upstream changes are overridden
   * Given startup replaces the offer section and confirms the resulting document
   * When only the hidden base offer changes
   * Then the effective reviewed body and confirmation remain unchanged
   */
  test("ignores base changes outside the effective document", () => {
    const override = "# Business\n\n## Offer\n\nPaid service.";
    const startup = confirmed(override, mergeMarkdown(body, override).content);
    const merged = mergeMarkdown(
      body.replace("Free framework.", "Different base offer."),
      startup,
    );
    expect(documentConfirmation(merged.content, "startup").confirmed).toBe(
      true,
    );
  });

  /**
   * BDD Scenario: Change a locally confirmed document
   * Given a confirmation has already been recorded
   * When the document body is edited without another user confirmation
   * Then the previous stamp no longer confirms the current body
   */
  test("detects edits after confirmation", () => {
    const changed = confirmed(body).replace("Six hours.", "Twelve hours.");
    expect(documentConfirmation(changed, "singlepage").state).toBe("changed");
  });

  /**
   * BDD Scenario: Require explicit confirmation details
   * Given an empty document or an incomplete confirmation
   * When confirmation is evaluated
   * Then a boolean alone does not certify unreviewed text
   */
  test("does not confirm empty or incompletely attributed documents", () => {
    expect(
      documentConfirmation(confirmed("# Empty"), "singlepage").confirmed,
    ).toBe(false);
    expect(
      documentConfirmation(
        "---\nconfirmation: { confirmed: true }\n---\n" + body,
        "singlepage",
      ).confirmed,
    ).toBe(false);
    expect(() =>
      parseDocument('---\nconfirmation: { confirmed: "false" }\n---\n'),
    ).toThrow("must be true or false");
  });

  /**
   * BDD Scenario: Replace a document rather than merge sections
   * Given a replacement source has different content and no approval
   * When replacement resolution runs
   * Then the previous approval cannot survive
   */
  test("resets confirmation for replacement documents", () => {
    const merged = mergeWorkspaceContent({
      base: confirmed(body),
      overlay: "# Business\n\nNew model.",
      kind: "business",
      sourcePath: "startup.md",
      strategy: "replace",
    });
    expect(documentConfirmation(merged.content, "startup").confirmed).toBe(
      false,
    );
  });

  /**
   * BDD Scenario: Keep YAML document approvals bound to their data
   * Given a YAML register was confirmed
   * When a startup override changes one field
   * Then its approval is cleared while an empty startup preserves the base
   */
  test("supports YAML source data without inheriting approval across edits", () => {
    const source = "schema: demo\ncapacity: 6\n";
    const yaml = `${source}confirmation:\n  confirmed: true\n  by: operator\n  at: 2026-09-11\n  content_sha256: ${documentFingerprint(source, "yaml")}\n`;
    expect(
      documentConfirmation(mergeYaml(yaml, "").content, "singlepage", "yaml")
        .confirmed,
    ).toBe(true);
    expect(
      documentConfirmation(
        mergeYaml(yaml, "capacity: 2").content,
        "startup",
        "yaml",
      ).confirmed,
    ).toBe(false);
  });

  /**
   * BDD Scenario: Render a document below its existing page title
   * Given frontmatter and a leading document heading
   * When the review body is displayed
   * Then only metadata and the duplicated title disappear
   */
  test("keeps section headings while hiding metadata and the duplicate title", () => {
    const result = documentReviewBody(confirmed(body), true);
    expect(result).not.toContain("confirmation:");
    expect(result).not.toMatch(/^# Business/);
    expect(result).toContain("## Offer");
    expect(result).toContain("## Capacity");
  });

  /**
   * BDD Scenario: Reject documents with no visible content
   * Given a matching approval stamp covers only headings, whitespace, or comments
   * When confirmation is evaluated, including an unclosed comment
   * Then hidden text cannot make the empty document confirmed
   */
  test("does not confirm headings or comment-only documents", () => {
    for (const source of [
      "# Title\n\n<!-- note -->\n## Section\n<!-- multiline\ncomment -->",
      "<!-- first --><!-- second -->\n# Title",
      "# Title\n\n<!-- unclosed comment containing text",
      "<!--".repeat(10000),
      "#\n##\t\n###",
    ]) {
      expect(
        documentConfirmation(confirmed(source), "singlepage").confirmed,
      ).toBe(false);
    }
  });

  /**
   * BDD Scenario: Recognize real content without rewriting it
   * Given approved text follows comments or an empty heading or includes literal delimiters
   * When document presence and the fingerprint are checked
   * Then visible content remains confirmed and its review text stays unchanged
   */
  test("checks content presence without stripping or joining text", () => {
    for (const source of [
      "# \nVisible paragraph.",
      "<!-- note -->\n# Title\n\n<!-- hidden -->Visible paragraph.",
      "<!<!-- hidden -->--",
      "```html\n<!-- example -->\n```",
      "####### Plain text, not a heading",
    ]) {
      const stamped = confirmed(source);
      expect(documentConfirmation(stamped, "singlepage").confirmed).toBe(true);
      expect(documentReviewBody(stamped).trim()).toBe(source);
    }
  });

  /**
   * BDD Scenario: Hide a leading title after comments
   * Given comments precede an H1 with either LF or CRLF line endings
   * When the page already supplies the title
   * Then comments, paragraphs, and later headings retain their original text
   */
  test("preserves comments and sections while removing only the leading H1", () => {
    for (const newline of ["\n", "\r\n"]) {
      const prefix = `<!-- first -->${newline}<!-- second${newline}line -->${newline}`;
      const content = `${newline}Paragraph.${newline}## Section${newline}# Later title`;
      expect(
        documentReviewBody(`${prefix}# Title${newline}${content}`, true),
      ).toBe(prefix + content);
      expect(documentReviewBody(`${prefix}# Title`, true)).toBe(prefix);
    }
  });

  /**
   * BDD Scenario: Preserve text when a leading title is absent
   * Given a paragraph, code fence, section heading, or unclosed comment comes first
   * When the review requests title suppression
   * Then no later heading or comment content is removed
   */
  test("leaves non-leading titles and malformed comments untouched", () => {
    for (const source of [
      "Paragraph.\n# Later title",
      "## Section\n# Later title",
      "```markdown\n# Example\n```",
      "<!-- unclosed\n# Hidden title",
      "<!-- note -->\n# \nParagraph.",
    ]) {
      expect(documentReviewBody(source, true)).toBe(source);
      expect(documentReviewBody(source, false)).toBe(source);
    }
  });

  /**
   * BDD Scenario: Bound work for adversarial comment sequences
   * Given thousands of comments, whitespace characters, and unclosed comment starts
   * When the actual document helpers run in an isolated V8 process
   * Then they finish within the process deadline and preserve the expected content and status
   */
  test("handles adversarial comments without blocking document review", () => {
    const result = spawnSync(
      "node",
      [
        "--experimental-strip-types",
        "--input-type=module",
        "--eval",
        `
        import assert from "node:assert/strict";
        const { documentReviewBody, documentConfirmation, documentFingerprint, renderDocument } = await import(process.argv[1]);
        const comments = "<!--" + "--><!--".repeat(20000) + "-->";
        const paragraph = comments + "\\nPlain paragraph without a title";
        assert.equal(documentReviewBody(paragraph, true), paragraph);
        assert.equal(documentReviewBody(comments + "\\n# Title\\nText", true), comments + "\\nText");
        assert.equal(documentReviewBody(" ".repeat(100000) + "No title", true), "No title");
        for (const source of [comments, "<!--".repeat(20000)]) {
          const stamped = renderDocument({ body: source, metadata: { confirmation: {
            confirmed: true, by: "operator", at: "2026-09-11", content_sha256: documentFingerprint(source)
          } } });
          assert.equal(documentConfirmation(stamped, "singlepage").confirmed, false);
        }
      `,
        new URL("./document.ts", import.meta.url).href,
      ],
      { encoding: "utf8", timeout: 5000 },
    );
    expect({
      error: result.error?.message,
      stderr: result.stderr,
      status: result.status,
    }).toEqual({
      error: undefined,
      stderr: "",
      status: 0,
    });
  }, 10000);
});
