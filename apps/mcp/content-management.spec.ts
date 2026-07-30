/**
 * BDD Suite: MCP compact content-management registration
 * Given the MCP server boots its compact content-management module
 * When resources and tools are registered
 * Then AI chat clients discover project guidance and compact module/model/relation tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerPrompts,
  registerResources,
  registerTools,
} from "./content-management";
import {
  CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
  PROJECT_GUIDE_RESOURCE_URI,
} from "./lib/guidance";

describe("MCP content-management registration", () => {
  /**
   * BDD Scenario: Project and content guidance resources are registered
   * Given the content-management module is loaded
   * When resources are registered on the MCP server
   * Then project, mutation, and module discovery resources are available to AI clients
   */
  it("registers project, mutation, and module discovery resources", async () => {
    const mcp = {
      registerResource: jest.fn(),
    } as unknown as McpServer;

    registerResources(mcp);

    const registeredResources = (
      mcp.registerResource as jest.Mock
    ).mock.calls.map(([name, uri]) => ({ name, uri }));

    expect(registeredResources).toEqual(
      expect.arrayContaining([
        {
          name: "project-guide",
          uri: PROJECT_GUIDE_RESOURCE_URI,
        },
        {
          name: "content-operations-guide",
          uri: CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
        },
        {
          name: "module-list",
          uri: "singlepagestartup://modules",
        },
      ]),
    );

    const projectGuideResource = (
      mcp.registerResource as jest.Mock
    ).mock.calls.find(([name]) => name === "project-guide");
    const response = await projectGuideResource[3](
      new URL(PROJECT_GUIDE_RESOURCE_URI),
    );
    const payload = JSON.parse(response.contents[0].text);

    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        type: "project-guide",
        data: expect.objectContaining({
          project: expect.objectContaining({
            name: "SinglePageStartup",
          }),
          mcpBoundary: expect.any(Object),
          architecture: expect.any(Object),
          taskRoutes: expect.any(Array),
          nonNegotiableRules: expect.any(Array),
        }),
      }),
    );
  });

  /**
   * BDD Scenario: Guidance and compact tools are registered
   * Given the content-management module is loaded
   * When tools are registered on the MCP server
   * Then guide, module, model, relation, and page tools are available without legacy generated CRUD names
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
        "project-guide",
        "content-operations-guide",
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
      ]),
    );
    expect(toolNames).not.toContain("blog-module-article-get");
    expect(toolNames).not.toContain("content-record-find");
    expect(toolNames).not.toContain("page-localized-field-update");

    const projectGuideToolCall = (
      mcp.registerTool as jest.Mock
    ).mock.calls.find(([name]) => name === "project-guide");
    const projectGuideResponse = await projectGuideToolCall[2]({});
    const projectGuidePayload = JSON.parse(
      projectGuideResponse.content[0].text,
    );

    expect(projectGuidePayload.data).toEqual(
      expect.objectContaining({
        project: expect.objectContaining({
          name: "SinglePageStartup",
        }),
        contentComposition: expect.objectContaining({
          pageGraph: expect.arrayContaining([
            expect.stringContaining("host.pages-to-widgets"),
            expect.stringContaining("host.widgets-to-external-widgets"),
          ]),
        }),
        taskRoutes: expect.arrayContaining([
          expect.objectContaining({
            intent: "Create a business entity",
            read: expect.arrayContaining([
              expect.stringContaining("model-schema"),
              expect.stringContaining("natural key"),
            ]),
            createOrChange: expect.arrayContaining([
              expect.stringContaining("Dry-run model-record-create"),
              expect.stringContaining("relation records"),
            ]),
            verify: expect.arrayContaining([
              expect.stringContaining("returned model id"),
              expect.stringContaining("complete graph"),
            ]),
          }),
          expect.objectContaining({
            intent: "Change text or content visible at a URL",
            read: expect.arrayContaining([
              expect.stringContaining("page-preview"),
              expect.stringContaining("model-record-get"),
            ]),
            createOrChange: expect.arrayContaining([
              expect.stringContaining("model-record-update"),
              expect.stringContaining("complete current localized object"),
            ]),
            verify: expect.arrayContaining([
              expect.stringContaining("page-preview"),
              expect.stringContaining("model-record-get"),
            ]),
          }),
          expect.objectContaining({
            intent: expect.stringContaining("application behavior"),
            read: expect.arrayContaining(["AI_GUIDE.md", "root README.md"]),
            createOrChange: expect.arrayContaining([
              expect.stringContaining("code-capable repository workflow"),
            ]),
            verify: expect.arrayContaining([
              expect.stringContaining("Nx tests"),
            ]),
          }),
        ]),
      }),
    );

    const writeToolNames = [
      "model-record-create",
      "model-record-update",
      "model-record-delete-apply",
      "relation-record-create",
      "relation-record-update",
      "relation-record-delete-apply",
    ];

    for (const writeToolName of writeToolNames) {
      const writeToolCall = (mcp.registerTool as jest.Mock).mock.calls.find(
        ([name]) => name === writeToolName,
      );
      const description = writeToolCall[1].description;

      expect(description).toContain("project-guide");
      expect(description).toContain("content-operations-guide");
      expect(description).toContain("same connector");
      expect(description).toContain("read back");
      expect(description).toContain("UNKNOWN");
    }

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

  /**
   * BDD Scenario: Task-solving prompt is registered
   * Given an MCP client supports prompts
   * When content-management prompts are registered
   * Then the client can request a task-specific workflow that starts with project guidance
   */
  it("registers the SinglePageStartup task-solving prompt", () => {
    const mcp = {
      registerPrompt: jest.fn(),
    } as unknown as McpServer;

    registerPrompts(mcp);

    const promptCall = (mcp.registerPrompt as jest.Mock).mock.calls[0];
    const response = promptCall[2]({
      task: "Change the subscription interval",
    });

    expect(promptCall[0]).toBe("solve-singlepagestartup-task");
    expect(promptCall[1].description).toContain("project guidance");
    expect(response.messages[0]).toEqual(
      expect.objectContaining({
        role: "user",
        content: expect.objectContaining({
          type: "text",
          text: expect.stringContaining("Change the subscription interval"),
        }),
      }),
    );
    expect(response.messages[0].content.text).toContain("project-guide");
    expect(response.messages[0].content.text).toContain(
      "content-operations-guide",
    );
    expect(response.messages[0].content.text).toContain("READ-BACK");
  });
});
