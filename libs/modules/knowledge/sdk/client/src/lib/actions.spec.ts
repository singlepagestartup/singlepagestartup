/**
 * BDD Suite: knowledge client SDK actions.
 *
 * Given: the browser SDK wraps knowledge custom API routes.
 * When: search, generate, and index actions execute.
 * Then: the expected route paths and response shapes are preserved.
 */

import { generate, index, models, search } from ".";

describe("knowledge client SDK actions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as any;
  });

  /**
   * BDD Scenario: search route.
   *
   * Given: a search query.
   * When: the client SDK action executes.
   * Then: it posts to `/api/knowledge/search`.
   */
  it("builds the search route", async () => {
    await search.action({ host: "http://api.test", query: "storage" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/knowledge/search",
      expect.objectContaining({ method: "POST" }),
    );
  });

  /**
   * BDD Scenario: generate route.
   *
   * Given: a generation query.
   * When: the client SDK action executes.
   * Then: it posts to `/api/knowledge/generate`.
   */
  it("builds the generate route", async () => {
    await generate.action({
      host: "http://api.test",
      query: "storage",
      generationModelSlug: "qwen/qwen3-1-7b",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/knowledge/generate",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("qwen/qwen3-1-7b"),
      }),
    );
  });

  /**
   * BDD Scenario: models route.
   *
   * Given: a model task filter.
   * When: the client SDK action executes.
   * Then: it fetches `/api/knowledge/models`.
   */
  it("builds the models route", async () => {
    await models.action({ host: "http://api.test", task: "chat" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/knowledge/models?task=chat",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Cache-Control": "no-store",
        }),
      }),
    );
  });

  /**
   * BDD Scenario: index route.
   *
   * Given: an indexing request.
   * When: the client SDK action executes.
   * Then: it posts to `/api/knowledge/index`.
   */
  it("builds the index route", async () => {
    await index.action({ host: "http://api.test", limit: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/knowledge/index",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
