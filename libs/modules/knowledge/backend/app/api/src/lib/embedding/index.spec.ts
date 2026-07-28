/**
 * BDD Suite: knowledge embedding client.
 *
 * Given: an LLM gateway embedding client with a mocked fetch implementation.
 * When: embedding responses are returned or rejected.
 * Then: vectors are validated before callers use them.
 */

import { LlmEmbeddingClient, OpenRouterEmbeddingClient } from ".";

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
   * BDD Scenario: non-finite embedding value.
   *
   * Given: a provider returns Infinity inside an otherwise valid vector.
   * When: the client validates the response.
   * Then: the value is rejected before pgvector persistence.
   */
  it("rejects non-finite embedding values", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: [{ embedding: [0.1, Infinity, 0.3] }] }),
          { status: 200 },
        ),
      );
    const client = new LlmEmbeddingClient({
      baseUrl: "http://llm.test",
      model: "local/default-embedding",
      dimensions: 3,
      fetcher,
    });

    await expect(client.embed("hello")).rejects.toThrow("non-numeric");
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

  /**
   * BDD Scenario: LLM gateway network failure.
   *
   * Given: apps/llm is not reachable.
   * When: the client embeds content.
   * Then: the error includes the gateway URL and startup command.
   */
  it("reports embedding network failures with the target URL", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("Unable to connect"));
    const client = new LlmEmbeddingClient({
      baseUrl: "http://llm.test/",
      model: "nomic/nomic-embed-text",
      dimensions: 3,
      fetcher,
    });

    await expect(client.embed("hello")).rejects.toThrow(
      "LLM embedding request could not connect to LLM gateway at http://llm.test",
    );
  });

  /**
   * BDD Scenario: authenticated OpenRouter embedding request.
   *
   * Given: apps/api selected an OpenRouter embedding model.
   * When: multiple chunks are embedded.
   * Then: the request includes authentication, float encoding, and 768 dimensions.
   */
  it("sends provider-specific OpenRouter request fields", async () => {
    const embeddings = [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ];
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { embedding: embeddings[1], index: 1 },
            { embedding: embeddings[0], index: 0 },
          ],
        }),
        { status: 200 },
      ),
    );
    const client = new OpenRouterEmbeddingClient({
      baseUrl: "https://openrouter.test/api/v1/",
      model: "qwen/qwen3-embedding-8b",
      dimensions: 3,
      apiKey: "test-open-router-key",
      fetcher,
    });

    await expect(client.embedMany(["first", "second"])).resolves.toEqual(
      embeddings,
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://openrouter.test/api/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-open-router-key",
        }),
      }),
    );
    const request = fetcher.mock.calls[0][1] as RequestInit;

    expect(JSON.parse(String(request.body))).toEqual({
      model: "qwen/qwen3-embedding-8b",
      input: ["first", "second"],
      dimensions: 3,
      encoding_format: "float",
    });
  });

  /**
   * BDD Scenario: missing OpenRouter credentials.
   *
   * Given: OpenRouter is selected without an API key.
   * When: the embedding client is constructed.
   * Then: it fails before any remote request can be made.
   */
  it("requires an OpenRouter API key", () => {
    expect(
      () =>
        new OpenRouterEmbeddingClient({
          baseUrl: "https://openrouter.ai/api/v1",
          model: "qwen/qwen3-embedding-8b",
          apiKey: "",
        }),
    ).toThrow("OPEN_ROUTER_API_KEY");
  });
});
