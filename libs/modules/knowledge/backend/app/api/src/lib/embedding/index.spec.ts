/**
 * BDD Suite: knowledge embedding client.
 *
 * Given: an LLM gateway embedding client with a mocked fetch implementation.
 * When: embedding responses are returned or rejected.
 * Then: vectors are validated before callers use them.
 */

import { LlmEmbeddingClient } from ".";

describe("knowledge embedding client", () => {
  /**
   * BDD Scenario: valid Ollama embedding response.
   *
   * Given: apps/llm returns one embedding with the configured dimensions.
   * When: the client embeds one input.
   * Then: the embedding is returned unchanged.
   */
  it("returns a valid embedding", async () => {
    const embedding = Array.from({ length: 3 }, (_, index) => index / 10);
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ object: "embedding", embedding, index: 0 }],
        }),
        {
          status: 200,
        },
      ),
    );
    const client = new LlmEmbeddingClient({
      baseUrl: "http://llm.test",
      model: "nomic/nomic-embed-text",
      dimensions: 3,
      fetcher,
    });

    await expect(client.embed("hello")).resolves.toEqual(embedding);
    expect(fetcher).toHaveBeenCalledWith(
      "http://llm.test/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("nomic/nomic-embed-text"),
      }),
    );
  });

  /**
   * BDD Scenario: malformed LLM gateway vector.
   *
   * Given: apps/llm returns a vector with the wrong dimension count.
   * When: the client validates the response.
   * Then: an actionable dimension error is raised.
   */
  it("rejects malformed embedding dimensions", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] }), {
        status: 200,
      }),
    );
    const client = new LlmEmbeddingClient({
      baseUrl: "http://llm.test",
      model: "nomic/nomic-embed-text",
      dimensions: 3,
      fetcher,
    });

    await expect(client.embed("hello")).rejects.toThrow("expected 3");
  });

  /**
   * BDD Scenario: LLM gateway unavailable.
   *
   * Given: apps/llm responds with a non-2xx status.
   * When: the client embeds content.
   * Then: the error points to the local service.
   */
  it("reports unavailable LLM gateway service", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(new Response("nope", { status: 503 }));
    const client = new LlmEmbeddingClient({
      baseUrl: "http://llm.test",
      model: "nomic/nomic-embed-text",
      dimensions: 3,
      fetcher,
    });

    await expect(client.embed("hello")).rejects.toThrow(
      "Ensure apps/llm is running",
    );
  });
});
