/**
 * BDD Suite: knowledge chunker.
 *
 * Given: normalized source text and chunking options.
 * When: content is split for embeddings.
 * Then: stable chunk indexes, overlap, and hashes are produced.
 */

import { chunkText, hashText } from ".";

describe("knowledge chunker", () => {
  /**
   * BDD Scenario: short document.
   *
   * Given: source text shorter than the chunk size.
   * When: the chunker runs.
   * Then: exactly one indexed chunk is produced.
   */
  it("keeps short documents in one chunk", () => {
    const chunks = chunkText({ text: "short document", chunkTokens: 10 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      chunkIndex: 0,
      text: "short document",
    });
    expect(chunks[0].contentHash).toHaveLength(64);
  });

  /**
   * BDD Scenario: overlapping chunks.
   *
   * Given: text longer than the chunk size.
   * When: the chunker runs with overlap.
   * Then: later chunks reuse trailing context from earlier chunks.
   */
  it("creates stable overlapping chunks", () => {
    const chunks = chunkText({
      text: "one two three four five six seven eight",
      chunkTokens: 4,
      overlapTokens: 1,
    });

    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1, 2]);
    expect(chunks[1].text.startsWith("four")).toBe(true);
  });

  /**
   * BDD Scenario: default embedding chunks.
   *
   * Given: source text exceeds the default embedding chunk size.
   * When: the chunker runs without explicit options.
   * Then: it produces smaller chunks that fit the local embedding model context.
   */
  it("keeps default chunks small enough for local embeddings", () => {
    const text = Array.from({ length: 450 }, (_, index) => `word${index}`).join(
      " ",
    );

    const chunks = chunkText({ text });

    expect(chunks).toHaveLength(3);
    expect(Math.max(...chunks.map((chunk) => chunk.text.length))).toBeLessThan(
      1800,
    );
  });

  /**
   * BDD Scenario: hash input normalization.
   *
   * Given: a caller passes a non-string value into the hash helper.
   * When: the helper hashes that value.
   * Then: it normalizes the value instead of passing it directly to crypto.
   */
  it("normalizes non-string hash input", () => {
    expect(hashText(new Date("2026-01-01T00:00:00.000Z"))).toHaveLength(64);
  });
});
