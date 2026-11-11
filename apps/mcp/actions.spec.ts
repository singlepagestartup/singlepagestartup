/**
 * BDD Suite: MCP project guidance delivery
 * Given an AI client connects to the SinglePageStartup MCP server
 * When initialization and capability discovery complete
 * Then the client receives server instructions and can read project guidance through standard MCP surfaces
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./actions";
import {
  CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
  PROJECT_GUIDE_RESOURCE_URI,
} from "./lib/guidance";

describe("MCP project guidance delivery", () => {
  /**
   * BDD Scenario: Guidance reaches a newly connected AI client
   * Given a client supports MCP instructions, tools, resources, and prompts
   * When it connects and discovers the SinglePageStartup server
   * Then every guidance channel exposes the project model and safe mutation workflow
   */
  it("delivers project guidance through initialization and capabilities", async () => {
    const server = createMcpServer();
    const client = new Client({
      name: "guidance-test-client",
      version: "1.0.0",
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      expect(client.getInstructions()).toContain(
        "SinglePageStartup runtime content and data MCP",
      );
      expect(client.getInstructions()).toContain(
        "READ -> IMPACT CHECK -> DRY-RUN -> COMMIT",
      );
      expect(client.getInstructions()).toContain("same connector");
      expect(client.getInstructions()).toContain("UNKNOWN");

      const [tools, resources, prompts] = await Promise.all([
        client.listTools(),
        client.listResources(),
        client.listPrompts(),
      ]);

      expect(tools.tools.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          "project-guide",
          "content-operations-guide",
          "module-list",
          "model-record-update",
          "relation-record-update",
          "page-preview",
        ]),
      );
      expect(resources.resources.map(({ uri }) => uri)).toEqual(
        expect.arrayContaining([
          PROJECT_GUIDE_RESOURCE_URI,
          CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
          "singlepagestartup://modules",
        ]),
      );
      expect(prompts.prompts.map(({ name }) => name)).toContain(
        "solve-singlepagestartup-task",
      );

      const projectGuideResource = await client.readResource({
        uri: PROJECT_GUIDE_RESOURCE_URI,
      });
      const guideContent = projectGuideResource.contents[0];
      if (!guideContent || !("text" in guideContent)) {
        throw new Error("Expected project-guide text resource");
      }
      const projectGuidePayload = JSON.parse(guideContent.text);

      expect(projectGuidePayload.data).toEqual(
        expect.objectContaining({
          project: expect.objectContaining({
            name: "SinglePageStartup",
          }),
          architecture: expect.any(Object),
          contentComposition: expect.any(Object),
          taskRoutes: expect.any(Array),
          nonNegotiableRules: expect.any(Array),
        }),
      );

      const guideToolResponse = await client.callTool({
        name: "content-operations-guide",
        arguments: {},
      });
      const parsedGuideToolResponse =
        CallToolResultSchema.parse(guideToolResponse);
      const guideToolContent = parsedGuideToolResponse.content[0];

      expect(guideToolContent.type).toBe("text");

      if (guideToolContent.type !== "text") {
        throw new Error("Expected content-operations-guide text response");
      }

      const operationsGuidePayload = JSON.parse(guideToolContent.text);

      expect(operationsGuidePayload.data.protocol).toEqual([
        "READ",
        "IMPACT CHECK",
        "DRY-RUN",
        "COMMIT",
        "READ-BACK",
        "COMPARE",
      ]);
      expect(operationsGuidePayload.data.connectorInvariant).toContain(
        "same MCP connector",
      );
      expect(operationsGuidePayload.data.ambiguityRule).toContain("UNKNOWN");
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("rejects oversized tool arguments before validation and keeps the session usable", async () => {
    const server = createMcpServer();
    const client = new Client({ name: "input-limit-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const rejected = await client.callTool({
        name: "content-operations-guide",
        arguments: { items: Array(10_001).fill(null) },
      });
      expect(rejected.isError).toBe(true);
      expect(rejected.content).toEqual([
        expect.objectContaining({
          text: expect.stringContaining("10000 elements"),
        }),
      ]);

      const accepted = await client.callTool({
        name: "content-operations-guide",
        arguments: {},
      });
      expect(accepted.isError).not.toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
