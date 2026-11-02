/**
 * BDD Suite: Workspace statement form
 * Given the editorial contract requires statements to describe a state
 * When workspace documents are inspected for decision records
 * Then attributed and dated decisions are reported and attribution is exempt
 */
import { describe, expect, it } from "bun:test";

import { inspectDocument, inspectStatement } from "./statement-form";

describe("statement form", () => {
  /**
   * BDD Scenario: A state passes
   * Given a statement that describes what is true
   * When it is inspected
   * Then no rule fires
   */
  it("accepts a statement that describes a state", () => {
    expect(inspectStatement("Purchased tokens do not expire.")).toEqual([]);
  });

  /**
   * BDD Scenario: A future state passes
   * Given a statement about a state that is not yet reached
   * When it is inspected
   * Then no rule fires, because a future state is still a state
   */
  it("accepts a future state", () => {
    expect(
      inspectStatement("Tokens will be sold in five rouble packages."),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: The operator as actor is reported
   * Given a statement that names who decided
   * When it is inspected
   * Then the attributed-decision rule fires
   */
  it("reports the operator as the actor of a decision", () => {
    expect(
      inspectStatement(
        "The operator accepted that as ordinary market pricing.",
      ),
    ).toContain("attributed-decision");
  });

  /**
   * BDD Scenario: The passive attribution is reported
   * Given a decision credited to the operator in the passive voice
   * When it is inspected
   * Then the attributed-decision rule still fires
   */
  it("reports a decision credited to the operator in the passive voice", () => {
    expect(
      inspectStatement("Five packages, selected by the operator, are sold."),
    ).toContain("attributed-decision");
  });

  /**
   * BDD Scenario: A dated decision is reported
   * Given a date in the same sentence as a decision verb
   * When it is inspected
   * Then the dated-decision rule fires
   */
  it("reports a date inside a decision sentence", () => {
    expect(
      inspectStatement(
        "Token terms were selected on 2026-09-18 and are fixed.",
      ),
    ).toContain("dated-decision");
  });

  /**
   * BDD Scenario: A date beside a state is left alone
   * Given a date in a sentence that carries no decision verb
   * When it is inspected
   * Then no rule fires, because research prose dates its observations
   */
  it("leaves a date that does not date a decision", () => {
    expect(
      inspectStatement(
        "Offers were checked on 2026-09-13 across four vendors.",
      ),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: An accessed source keeps its date
   * Given research prose that dates the source it accessed
   * When it is inspected
   * Then no rule fires, even though the sentence also carries a decision word
   */
  it("leaves a dated source beside a decision word", () => {
    expect(
      inspectStatement(
        "This review combines confirmed project direction with documentation accessed 2026-09-13.",
      ),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: A field window keeps its dates
   * Given a research source row carrying a survey window and a self-selected sample
   * When it is inspected
   * Then no rule fires
   */
  it("leaves a survey window and a self-selected sample", () => {
    expect(
      inspectStatement("2025-05-29-2025-06-23, self-selected developer sample"),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: Attribution fields are exempt
   * Given a dated decision inside the frontmatter source field
   * When the document is inspected
   * Then the finding is suppressed, because source is where dates belong
   */
  it("exempts the attribution fields", () => {
    const document = [
      "---",
      "sources:",
      "  terms:",
      "    source: Operator selected the terms in chat, 2026-09-18.",
      "    scope: Tokens do not expire.",
      "---",
      "",
      "# Brief",
    ].join("\n");
    expect(inspectDocument("brief.md", document)).toEqual([]);
  });

  /**
   * BDD Scenario: A statement field is inspected
   * Given a dated decision inside a scope field
   * When the document is inspected
   * Then the finding names that line
   */
  it("reports a dated decision inside a scope field", () => {
    const document = [
      "---",
      "sources:",
      "  terms:",
      "    source: Operator statement in chat.",
      "    scope: The operator decided on 2026-09-18 that tokens do not expire.",
      "---",
      "",
      "# Brief",
    ].join("\n");
    const findings = inspectDocument("brief.md", document);
    expect(findings.map((finding) => finding.rule)).toContain(
      "attributed-decision",
    );
    expect(findings[0]?.line).toBe(5);
  });

  /**
   * BDD Scenario: Body prose is inspected
   * Given a decision record in the document body
   * When the document is inspected
   * Then the finding names that line
   */
  it("reports a decision record in the body", () => {
    const document = [
      "---",
      "confirmation:",
      "  confirmed: true",
      "---",
      "",
      "# Brief",
      "",
      "The operator selected Contabo as the host.",
    ].join("\n");
    const findings = inspectDocument("brief.md", document);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(8);
  });
});
