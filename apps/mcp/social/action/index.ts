import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialActionApi } from "@sps/social/models/action/sdk/server";
import { insertSchema as socialActionInsertSchema } from "@sps/social/models/action/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-actions",
    "sps://social/actions",
    {
      title: "social module actions",
      description: "Get list of all actions from social module",
    },
    async (uri, extra) => {
      const resp = await socialActionApi.find({
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
    "social-module-action-count",
    "Count social module action",
    "Count social module action entities with optional filters.",
    socialActionApi,
  );

  mcp.registerTool(
    "social-module-action-get",
    {
      title: "List of social module actions",
      description: "Get list of all actions from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialActionApi.find({
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
    "social-module-action-get-by-id",
    {
      title: "Get social module action by id",
      description: "Get a action from social module by id.",
      inputSchema: {
        id: socialActionInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialActionApi.findById({
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
    "social-module-action-post",
    {
      title: "Create social module action",
      description: "Create a new action in the social module.",
      inputSchema: socialActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialActionApi.create({
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
    "social-module-action-patch",
    {
      title: "Update social module action by id",
      description: "Update an existing action in the social module by id.",
      inputSchema: socialActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialActionApi.update({
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
    "social-module-action-delete",
    {
      title: "Delete social module action by id",
      description: "Delete an existing action in the social module by id.",
      inputSchema: socialActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialActionApi.delete({
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
