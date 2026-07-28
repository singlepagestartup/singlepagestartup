/**
 * BDD Suite: MCP compact content-management registration
 * Given the MCP server boots its compact content-management module
 * When resources and tools are registered
 * Then AI chat clients discover only the compact module/model/relation tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources, registerTools } from "./content-management";

describe("MCP content-management registration", () => {
  /**
   * BDD Scenario: Compact module resource is registered
   * Given the content-management module is loaded
   * When resources are registered on the MCP server
   * Then the module list resource is available
   */
  it("registers the module discovery resource", () => {
    const mcp = {
      registerResource: jest.fn(),
    } as unknown as McpServer;

    registerResources(mcp);

    expect((mcp.registerResource as jest.Mock).mock.calls[0][0]).toBe(
      "module-list",
    );
    expect((mcp.registerResource as jest.Mock).mock.calls[0][1]).toBe(
      "sps://modules",
    );
  });

  /**
   * BDD Scenario: Compact tools are registered
   * Given the content-management module is loaded
   * When tools are registered on the MCP server
   * Then module, model, relation, and page helper tools are available without legacy generated CRUD names
   */
  it("registers compact module/model/relation tools only", async () => {
    const mcp = {
      registerTool: jest.fn(),
    } as unknown as McpServer;

    registerTools(mcp);

    const toolNames = (mcp.registerTool as jest.Mock).mock.calls.map(
      ([name]) => name,
    );

    expect(toolNames).toEqual(
      expect.arrayContaining([
        "module-list",
        "model-schema",
        "relation-schema",
        "model-record-count",
        "model-record-find",
        "model-record-get",
        "model-record-create",
        "model-record-update",
        "model-record-delete-preview",
        "model-record-delete-apply",
        "relation-record-count",
        "relation-record-find",
        "relation-record-get",
        "relation-record-create",
        "relation-record-update",
        "relation-record-delete-preview",
        "relation-record-delete-apply",
        "page-preview",
        "page-localized-field-update",
      ]),
    );
    expect(toolNames).not.toContain("blog-module-article-get");
    expect(toolNames).not.toContain("content-record-find");

    const listToolCall = (mcp.registerTool as jest.Mock).mock.calls.find(
      ([name]) => name === "module-list",
    );
    const response = await listToolCall[2]({});
    const payload = JSON.parse(response.content[0].text);

    expect(
      Buffer.byteLength(
        JSON.stringify({ isError: false, text: response.content[0].text }),
        "utf8",
      ),
    ).toBeLessThanOrEqual(32 * 1024);

    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        type: "module-list",
        data: {
          modules: expect.arrayContaining([
            expect.objectContaining({
              id: "blog",
              models: expect.arrayContaining([
                expect.objectContaining({ id: "article" }),
              ]),
              relations: expect.arrayContaining([
                expect.objectContaining({ id: "categories-to-articles" }),
              ]),
            }),
            expect.objectContaining({
              id: "website-builder",
              models: expect.arrayContaining([
                expect.objectContaining({ id: "widget" }),
              ]),
            }),
          ]),
        },
      }),
    );
  });
});
