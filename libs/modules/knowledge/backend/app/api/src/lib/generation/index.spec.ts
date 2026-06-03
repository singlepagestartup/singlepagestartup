/**
 * BDD Suite: knowledge LLM generation client.
 *
 * Given: Knowledge delegates model execution to apps/llm.
 * When: grounded generation is requested.
 * Then: the OpenAI-compatible gateway receives the selected model id.
 */

import { buildGroundedPrompt, LlmChatClient } from ".";

const contexts = [
  {
    id: "chunk-1",
    text: "Product documentation can reuse indexed knowledge fragments.",
    chunkIndex: 0,
    sourceTitle: "Documentation source",
    sourceOriginalPath: "knowledge.md",
    sourceType: "text",
    distance: 0.1,
    similarity: 0.9,
    metadata: {},
  },
];

describe("knowledge LLM generation client", () => {
  /**
   * BDD Scenario: selected gateway model.
   *
   * Given: an LLM gateway client and a Qwen model id.
   * When: grounded generation is requested.
   * Then: `/v1/chat/completions` receives the selected model id.
   */
  it("uses the selected LLM gateway model", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "qwen/qwen3-1-7b",
          provider: "ollama",
          provider_model: "qwen3:1.7b",
          choices: [{ message: { content: "answer" } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }),
        { status: 200 },
      ),
    );
    const client = new LlmChatClient({
      baseUrl: "http://llm.test/",
      fetcher,
    });

    await expect(
      client.generate({
        query: "documentation",
        contexts,
        model: "qwen/qwen3-1-7b",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        answer: "answer",
        model: "qwen/qwen3-1-7b",
        provider: "ollama",
        providerModel: "qwen3:1.7b",
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
      }),
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://llm.test/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        model: "qwen/qwen3-1-7b",
        stream: false,
      }),
    );
  });

  /**
   * BDD Scenario: unavailable gateway.
   *
   * Given: apps/llm responds with a non-2xx status.
   * When: Knowledge requests generation.
   * Then: the error points to the local gateway.
   */
  it("reports unavailable LLM gateway service", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(new Response("nope", { status: 503 }));
    const client = new LlmChatClient({
      baseUrl: "http://llm.test",
      fetcher,
    });

    await expect(
      client.generate({
        query: "documentation",
        contexts,
        model: "qwen/qwen3-1-7b",
      }),
    ).rejects.toThrow("Ensure apps/llm is running");
  });

  /**
   * BDD Scenario: query language.
   *
   * Given: the RAG prompt is assembled in Knowledge.
   * When: a model answers the prompt.
   * Then: the model is instructed to answer in the query language.
   */
  it("instructs the model to answer in the query language", () => {
    expect(
      buildGroundedPrompt({ query: "Какие помещения?", contexts }),
    ).toContain("Answer in the same language");
  });

  /**
   * BDD Scenario: ambiguous entity names.
   *
   * Given: a user asks about an ambiguous term.
   * When: the RAG prompt is assembled.
   * Then: the model is instructed to separate meanings instead of blending them.
   */
  it("instructs the model to disambiguate ambiguous terms", () => {
    const prompt = buildGroundedPrompt({
      query: "What does Delta mean here?",
      contexts,
    });

    expect(prompt).toContain("Disambiguate ambiguous terms");
    expect(prompt).toContain("Delta");
    expect(prompt).toContain("river delta");
  });
});
