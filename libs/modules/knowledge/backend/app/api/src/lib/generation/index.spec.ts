/**
 * BDD Suite: knowledge LLM generation client.
 *
 * Given: Knowledge delegates model execution to apps/llm.
 * When: grounded generation is requested.
 * Then: the OpenAI-compatible gateway receives the selected model id.
 */

import { buildGroundedPrompt, LlmChatClient } from ".";
import type { KnowledgeSearchResult } from "../types";

const contexts: KnowledgeSearchResult[] = [
  {
    id: "chunk-1",
    text: "Product documentation can reuse indexed knowledge fragments.",
    chunkIndex: 0,
    sourceId: "source-1",
    sourceTitle: "Documentation source",
    sourceOriginalPath: "knowledge.md",
    sourceType: "text",
    distance: 0.1,
    similarity: 0.9,
    retrievalRole: "seed",
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
   * BDD Scenario: LLM gateway network failure.
   *
   * Given: apps/llm is not reachable.
   * When: Knowledge requests generation.
   * Then: the error includes the gateway URL and startup command.
   */
  it("reports LLM gateway network failures with the target URL", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("Unable to connect"));
    const client = new LlmChatClient({
      baseUrl: "http://llm.test/",
      fetcher,
    });

    await expect(
      client.generate({
        query: "documentation",
        contexts,
        model: "openai/gpt-5-5",
      }),
    ).rejects.toThrow(
      "LLM generation request could not connect to LLM gateway at http://llm.test",
    );
  });

  /**
   * BDD Scenario: selected prompt skill without RAG fragments.
   *
   * Given: a user-selected chat skill has prompt instructions.
   * When: no indexed knowledge fragments match the query.
   * Then: the gateway is still called with the skill instructions and user query.
   */
  it("generates from selected skill instructions even without matched context", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "openai/gpt-5-5",
          provider: "openai",
          provider_model: "gpt-5.5",
          choices: [{ message: { content: "description" } }],
        }),
        { status: 200 },
      ),
    );
    const client = new LlmChatClient({
      baseUrl: "http://llm.test",
      fetcher,
    });

    await expect(
      client.generate({
        query: "Transcript text",
        contexts: [],
        model: "openai/gpt-5-5",
        skillInstructions: [
          {
            id: "skill-1",
            slug: "youtube-description",
            title: "YouTube Description Generator",
            instructions: "Create a YouTube description without emoji.",
          },
        ],
      }),
    ).resolves.toEqual(expect.objectContaining({ answer: "description" }));
    expect(
      JSON.parse(fetcher.mock.calls[0][1].body).messages[0].content,
    ).toContain("@youtube-description");
  });

  /**
   * BDD Scenario: history-only follow-up.
   *
   * Given: a user asks to edit the previous assistant response.
   * When: no indexed knowledge fragments are supplied.
   * Then: the gateway is still called with conversation history as source context.
   */
  it("generates from conversation history without RAG fragments", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "openai/gpt-5-5",
          provider: "openai",
          provider_model: "gpt-5.5",
          choices: [{ message: { content: "formatted answer" } }],
        }),
        { status: 200 },
      ),
    );
    const client = new LlmChatClient({
      baseUrl: "http://llm.test",
      fetcher,
    });

    await expect(
      client.generate({
        query: 'Поправь текст и замени "спикер" на "Максим Иванов"',
        contexts: [],
        model: "openai/gpt-5-5",
        chatHistory: [
          {
            role: "assistant",
            content: "В этом фрагменте спикер оценивает помещение.",
          },
        ],
      }),
    ).resolves.toEqual(expect.objectContaining({ answer: "formatted answer" }));

    const prompt = JSON.parse(fetcher.mock.calls[0][1].body).messages[0]
      .content;

    expect(prompt).toContain(
      "assistant: В этом фрагменте спикер оценивает помещение.",
    );
    expect(prompt).toContain(
      "No indexed knowledge fragments matched the query",
    );
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
