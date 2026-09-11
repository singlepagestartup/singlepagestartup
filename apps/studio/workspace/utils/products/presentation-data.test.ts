/**
 * BDD Suite: Independently owned product presentations
 * Given every product stores presentation content in its own source
 * When Studio renders a selected product
 * Then it uses that source without extracting decisions from other documents
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import { parseProductPresentation } from "./presentation-data";

const framework = readFileSync(
  new URL(
    "../../products/singlepage/singlepagestartup/presentation/data.yaml",
    import.meta.url,
  ),
  "utf8",
);
const chat = readFileSync(
  new URL(
    "../../products/singlepage/ai-chat/presentation/data.yaml",
    import.meta.url,
  ),
  "utf8",
);

describe("product presentation sources", () => {
  /**
   * BDD Scenario: Keep the two real products separate
   * Given Code Framework and AI Chat have their own presentation sources
   * When both sources are loaded
   * Then names and content match the owning product and no common Strategy is needed
   */
  test("loads the restored products from their own content", () => {
    const code = parseProductPresentation<{
      name: string;
      modules: string[];
      offer: string;
    }>(framework, "singlepagestartup");
    const ai = parseProductPresentation<{ name: string; slides: unknown[] }>(
      chat,
      "ai-chat",
    );
    expect(code.name).toBe("Code Framework");
    expect(code.modules).toHaveLength(16);
    expect(code.offer).toContain("free evaluation");
    expect(ai.name).toBe("AI Chat");
    expect(ai.slides).toHaveLength(6);
  });
  /**
   * BDD Scenario: Reject a presentation belonging to a different product
   * Given a startup product tries to use the framework presentation source
   * When its source is loaded
   * Then the mismatch fails instead of silently substituting framework decisions
   */
  test("rejects another product content", () => {
    expect(() => parseProductPresentation(framework, "ai-chat")).toThrow(
      "must belong",
    );
  });
  /**
   * BDD Scenario: Change only the owning presentation
   * Given the two products own separate source documents
   * When AI Chat presentation content changes
   * Then the framework presentation remains identical
   */
  test("isolates a presentation edit to its owner", () => {
    const before = parseProductPresentation<Record<string, unknown>>(
      framework,
      "singlepagestartup",
    );
    const edited = parse(chat);
    edited.content.slides[0].title = "A revised AI Chat offer";
    expect(
      parseProductPresentation<{ slides: Array<{ title: string }> }>(
        stringify(edited),
        "ai-chat",
      ).slides[0].title,
    ).toBe("A revised AI Chat offer");
    expect(
      parseProductPresentation<Record<string, unknown>>(
        framework,
        "singlepagestartup",
      ),
    ).toEqual(before);
  });
  /**
   * BDD Scenario: Require a presentation's own content
   * Given an incomplete source without content
   * When it is loaded
   * Then it fails rather than constructing a deck from shared documents
   */
  test("rejects missing own content", () => {
    expect(() =>
      parseProductPresentation(
        "schema: singlepagestartup.product-presentation.v1\nproduct_id: ai-chat",
        "ai-chat",
      ),
    ).toThrow("own content");
  });
});
