import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as agentWidgetApi } from "@sps/agent/models/widget/sdk/server";
import { insertSchema as agentWidgetInsertSchema } from "@sps/agent/models/widget/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "agent-module-widgets",
    "sps://agent/widgets",
    {
      title: "agent module widgets",
      description: "Get list of all widgets from agent module",
    },
    async (uri, extra) => {
      const resp = await agentWidgetApi.find({
        options: {
          headers: getMcpAuthHeaders(extra),
        },
      });

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(resp, null, 2),
          },
        ],
      };
    },
  );
}

export function registerTools(mcp: McpServer) {
  registerCountTool(
    mcp,
    "agent-module-widget-count",
    "Count agent module widget",
    "Count agent module widget entities with optional filters.",
    agentWidgetApi,
  );

  mcp.registerTool(
    "agent-module-widget-get",
    {
      title: "List of agent module widgets",
      description: "Get list of all widgets from agent module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await agentWidgetApi.find({
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entities, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "agent-module-widget-get-by-id",
    {
      title: "Get agent module widget by id",
      description: "Get a widget from agent module by id.",
      inputSchema: {
        id: agentWidgetInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await agentWidgetApi.findById({
          id: args.id,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "agent-module-widget-post",
    {
      title: "Create agent module widget",
      description: "Create a new widget in the agent module.",
      inputSchema: agentWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await agentWidgetApi.create({
          data: args,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "agent-module-widget-patch",
    {
      title: "Update agent module widget by id",
      description: "Update an existing widget in the agent module by id.",
      inputSchema: agentWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await agentWidgetApi.update({
          id: args.id,
          data: args,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "agent-module-widget-delete",
    {
      title: "Delete agent module widget by id",
      description: "Delete an existing widget in the agent module by id.",
      inputSchema: agentWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await agentWidgetApi.delete({
          id: args.id,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    },
  );
}
