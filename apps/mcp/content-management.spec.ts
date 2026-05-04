/**
 * BDD Suite: MCP content-management registration
 * Given the MCP server boots its content-management module
 * When resources and tools are registered
 * Then Codex can discover the canonical content entity and mutation tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources, registerTools } from "./content-management";

describe("MCP content-management registration", () => {
  /**
   * BDD Scenario: Content-management resource is registered
   * Given the content-management module is loaded
   * When resources are registered on the MCP server
   * Then the content entities resource is available
   */
  it("registers the content entity discovery resource", () => {
    const mcp = {
      registerResource: jest.fn(),
    } as unknown as McpServer;

    registerResources(mcp);

    expect((mcp.registerResource as jest.Mock).mock.calls[0][0]).toBe(
      "content-management-entities",
    );
    expect((mcp.registerResource as jest.Mock).mock.calls[0][1]).toBe(
      "sps://content/entities",
    );
  });

  /**
   * BDD Scenario: Content-management tools are registered
   * Given the content-management module is loaded
   * When tools are registered on the MCP server
   * Then discovery, CRUD, graph preview, and localized update tools are available
   */
  it("registers discovery, CRUD, graph, and localized update tools", async () => {
    const mcp = {
      registerTool: jest.fn(),
    } as unknown as McpServer;

    registerTools(mcp);

    const toolNames = (mcp.registerTool as jest.Mock).mock.calls.map(
      ([name]) => name,
    );

    expect(toolNames).toEqual(
      expect.arrayContaining([
        "content-entity-list",
        "content-entity-describe",
        "content-record-find",
        "content-record-count",
        "content-record-get-by-id",
        "content-record-create",
        "content-record-update",
        "content-record-delete-preview",
        "content-record-delete-apply",
        "content-host-graph-preview",
        "content-localized-field-update",
        "content-host-graph-localized-field-update",
      ]),
    );

    const listToolCall = (mcp.registerTool as jest.Mock).mock.calls.find(
      ([name]) => name === "content-entity-list",
    );
    const response = await listToolCall[2]({});
    const payload = JSON.parse(response.content[0].text);

    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        type: "content-entity-list",
        data: expect.arrayContaining([
          expect.objectContaining({
            key: "blog.widget",
            localizedFields: ["title", "subtitle", "description"],
          }),
        ]),
      }),
    );
  });
});
