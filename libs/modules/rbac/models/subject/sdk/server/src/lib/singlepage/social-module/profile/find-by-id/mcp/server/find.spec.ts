/**
 * BDD Suite: profile MCP catalog server SDK action.
 *
 * Given: an authenticated subject and owned social profile.
 * When: the server SDK requests MCP descriptors.
 * Then: it uses the owner-scoped RBAC route and returns the transformed catalog.
 */

import { action } from "./find";

describe("profile MCP catalog server SDK action", () => {
  /**
   * BDD Scenario: owner-scoped MCP descriptor request.
   *
   * Given: subject and profile ids.
   * When: the SDK action runs.
   * Then: the exact profile MCP servers route is fetched with GET.
   */
  it("requests the profile MCP server catalog", async () => {
    const originalFetch = global.fetch;
    const catalog = {
      supported: [{ id: "project", title: "Project MCP", description: "" }],
      connected: [],
      stale: [],
    };
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: catalog }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    try {
      await expect(
        action({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          host: "https://api.example.com",
        }),
      ).resolves.toEqual(catalog);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/rbac/subjects/subject-1/social-module/profiles/profile-1/mcp/servers",
        expect.objectContaining({ method: "GET" }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
