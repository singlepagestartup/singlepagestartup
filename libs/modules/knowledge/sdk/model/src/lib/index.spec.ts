/**
 * BDD Suite: knowledge generation model contract.
 *
 * Given: the public Knowledge SDK model contract.
 * When: default model ids and response interfaces are imported.
 * Then: Knowledge exposes model ids without owning provider catalog routing.
 */

import { DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG } from ".";

describe("knowledge generation model contract", () => {
  /**
   * BDD Scenario: default model slug.
   *
   * Given: Knowledge delegates the model catalog to apps/llm.
   * When: a generation request has no selected model.
   * Then: the client can still use the gateway default slug.
   */
  it("keeps the default generation model id stable", () => {
    expect(DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG).toBe("openai/gpt-5-5");
  });
});
