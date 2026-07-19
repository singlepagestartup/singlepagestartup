/**
 * BDD Suite: knowledge embedding provider configuration.
 *
 * Given: Knowledge can use the local LLM gateway or OpenRouter for embeddings.
 * When: apps/api environment variables are resolved.
 * Then: provider-specific URLs and model ownership are configured consistently.
 */

import {
  getKnowledgeConfiguration,
  KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL,
  KNOWLEDGE_LLM_EMBEDDING_MODEL,
} from "./configuration";

const originalEnvironment = {
  KNOWLEDGE_EMBEDDING_PROVIDER: process.env.KNOWLEDGE_EMBEDDING_PROVIDER,
  KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL:
    process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL,
  OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY,
};

describe("knowledge embedding provider configuration", () => {
  afterEach(() => {
    restoreEnvironment();
  });

  /**
   * BDD Scenario: local gateway owns its embedding model.
   *
   * Given: apps/api selects the local LLM embedding provider.
   * When: Knowledge resolves its embedding configuration.
   * Then: it calls the stable gateway alias instead of selecting an Ollama model.
   */
  it("uses the apps/llm default embedding alias", () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "llm";
    process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL =
      "qwen/ignored-by-local-provider";

    const config = getKnowledgeConfiguration();

    expect(config.embedding).toEqual(
      expect.objectContaining({
        provider: "llm",
        model: KNOWLEDGE_LLM_EMBEDDING_MODEL,
        dimensions: 768,
      }),
    );
  });

  /**
   * BDD Scenario: OpenRouter model is selected by apps/api.
   *
   * Given: apps/api selects OpenRouter and provides a model and API key.
   * When: Knowledge resolves its embedding configuration.
   * Then: the direct OpenRouter endpoint and configured model are returned.
   */
  it("uses the OpenRouter model configured in apps/api", () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "openrouter";
    process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL =
      "qwen/qwen3-embedding-8b";
    process.env.OPEN_ROUTER_API_KEY = "test-open-router-key";

    const config = getKnowledgeConfiguration();

    expect(config.embedding).toEqual({
      provider: "openrouter",
      url: "https://openrouter.ai/api/v1",
      model: "qwen/qwen3-embedding-8b",
      apiKey: "test-open-router-key",
      dimensions: 768,
    });
  });

  /**
   * BDD Scenario: OpenRouter uses the supported multi-provider default.
   *
   * Given: apps/api selects OpenRouter without overriding the embedding model.
   * When: Knowledge resolves its embedding configuration.
   * Then: Qwen3 Embedding 8B is selected as the default model.
   */
  it("defaults OpenRouter embeddings to Qwen3 Embedding 8B", () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "openrouter";
    delete process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL;

    const config = getKnowledgeConfiguration();

    expect(KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL).toBe(
      "qwen/qwen3-embedding-8b",
    );
    expect(config.embedding.model).toBe(
      KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL,
    );
  });

  /**
   * BDD Scenario: unsupported provider configuration.
   *
   * Given: apps/api contains an unknown embedding provider.
   * When: Knowledge resolves its configuration.
   * Then: startup fails with the accepted provider values.
   */
  it("rejects unsupported embedding providers", () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "unknown";

    expect(() => getKnowledgeConfiguration()).toThrow("llm or openrouter");
  });
});

function restoreEnvironment() {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
