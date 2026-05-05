import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialWidgetApi } from "@sps/social/models/widget/sdk/server";
import { insertSchema as socialWidgetInsertSchema } from "@sps/social/models/widget/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-widgets",
    "sps://social/widgets",
    {
      title: "social module widgets",
      description: "Get list of all widgets from social module",
    },
    async (uri, extra) => {
      const resp = await socialWidgetApi.find({
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
    "social-module-widget-count",
    "Count social module widget",
    "Count social module widget entities with optional filters.",
    socialWidgetApi,
  );

  mcp.registerTool(
    "social-module-widget-get",
    {
      title: "List of social module widgets",
      description: "Get list of all widgets from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialWidgetApi.find({
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
    "social-module-widget-get-by-id",
    {
      title: "Get social module widget by id",
      description: "Get a widget from social module by id.",
      inputSchema: {
        id: socialWidgetInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialWidgetApi.findById({
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
    "social-module-widget-post",
    {
      title: "Create social module widget",
      description: "Create a new widget in the social module.",
      inputSchema: socialWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialWidgetApi.create({
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
    "social-module-widget-patch",
    {
      title: "Update social module widget by id",
      description: "Update an existing widget in the social module by id.",
      inputSchema: socialWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialWidgetApi.update({
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
    "social-module-widget-delete",
    {
      title: "Delete social module widget by id",
      description: "Delete an existing widget in the social module by id.",
      inputSchema: socialWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialWidgetApi.delete({
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
