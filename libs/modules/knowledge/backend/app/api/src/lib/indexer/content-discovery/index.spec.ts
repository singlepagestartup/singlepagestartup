/**
 * BDD Suite: knowledge content parser.
 *
 * Given: supported content file shapes.
 * When: files are parsed into source records.
 * Then: type, title, hash, and metadata are normalized.
 */

import { parseKnowledgeSourceFile } from ".";

describe("knowledge content parser", () => {
  /**
   * BDD Scenario: timestamped transcript.
   *
   * Given: a timestamped content.txt transcript.
   * When: it is parsed.
   * Then: video metadata records detected timestamps.
   */
  it("parses timestamped content.txt transcripts", () => {
    const parsed = parseKnowledgeSourceFile({
      rootPath: "/content",
      filePath: "/content/video/show/episode/content.txt",
      content: "00:01 Intro\nCommercial real estate discussion",
    });

    expect(parsed.type).toBe("video");
    expect(parsed.metadata.hasTimestamps).toBe(true);
    expect(parsed.originalPath).toBe("video/show/episode/content.txt");
  });

  /**
   * BDD Scenario: markdown transcript.
   *
   * Given: a transcript.md file with a markdown heading.
   * When: it is parsed.
   * Then: title and transcript type are preserved.
   */
  it("parses markdown transcripts", () => {
    const parsed = parseKnowledgeSourceFile({
      rootPath: "/content",
      filePath: "/content/articles/product-docs/transcript.md",
      content: "# Product Docs\nDescription body",
    });

    expect(parsed.title).toBe("Product Docs");
    expect(parsed.type).toBe("transcript");
    expect(parsed.description).toBeNull();
    expect(parsed.contentHash).toHaveLength(64);
  });
});
