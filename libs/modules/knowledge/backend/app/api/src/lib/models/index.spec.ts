/**
 * BDD Suite: knowledge LLM model metadata client.
 *
 * Given: apps/llm exposes OpenAI-compatible model metadata.
 * When: Knowledge fetches model lists and individual models.
 * Then: snake_case gateway fields are normalized for TypeScript callers.
 */

import { LlmModelClient } from ".";

describe("knowledge LLM model metadata client", () => {
  /**
   * BDD Scenario: chat model list.
   *
   * Given: apps/llm returns model metadata.
   * When: Knowledge requests chat models.
   * Then: provider model fields are normalized to camelCase.
   */
  it("normalizes model list responses", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "qwen/qwen3-1-7b",
              label: "Qwen3 1.7B",
              provider: "ollama",
              provider_model: "qwen3:1.7b",
              task: "chat",
              local: true,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const client = new LlmModelClient({
      baseUrl: "http://llm.test",
      fetcher,
    });

    await expect(client.list({ task: "chat" })).resolves.toEqual([
      {
        id: "qwen/qwen3-1-7b",
        label: "Qwen3 1.7B",
        provider: "ollama",
        providerModel: "qwen3:1.7b",
        task: "chat",
        local: true,
        dimensions: undefined,
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      "http://llm.test/v1/models?task=chat",
      expect.objectContaining({ method: "GET" }),
    );
  });

  /**
   * BDD Scenario: embedding model metadata.
   *
   * Given: apps/llm returns embedding dimensions.
   * When: Knowledge asks for one embedding model.
   * Then: dimensions are available for schema validation.
   */
  it("reads embedding dimensions", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "nomic/nomic-embed-text",
          label: "Nomic Embed Text",
          provider: "ollama",
          provider_model: "nomic-embed-text",
          task: "embedding",
          local: true,
          dimensions: 768,
        }),
        { status: 200 },
      ),
    );
    const client = new LlmModelClient({
      baseUrl: "http://llm.test",
      fetcher,
    });

    await expect(client.get("nomic/nomic-embed-text")).resolves.toEqual(
      expect.objectContaining({ dimensions: 768 }),
    );
  });
});
