import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import { insertSchema as socialChatsToThreadsInsertSchema } from "@sps/social/relations/chats-to-threads/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-chats-to-threads",
    "sps://social/chats-to-threads",
    {
      title: "social chats-to-threads relation",
      description:
        "Get list of all chats-to-threads relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialChatsToThreadsApi.find({
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
    "social-chats-to-threads-count",
    "Count social chats to threads",
    "Count social chats to threads entities with optional filters.",
    socialChatsToThreadsApi,
  );

  mcp.registerTool(
    "social-chats-to-threads-get",
    {
      title: "List of social chats-to-threads relations",
      description:
        "Get list of all chats-to-threads relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialChatsToThreadsApi.find({
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
    "social-chats-to-threads-get-by-id",
    {
      title: "Get social chats-to-threads relation by id",
      description: "Get a chats-to-threads relation by id.",
      inputSchema: {
        id: socialChatsToThreadsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialChatsToThreadsApi.findById({
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
    "social-chats-to-threads-post",
    {
      title: "Create social chats-to-threads relation",
      description:
        "Create a new chats-to-threads relation in the social module.",
      inputSchema: socialChatsToThreadsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialChatsToThreadsApi.create({
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
    "social-chats-to-threads-patch",
    {
      title: "Update social chats-to-threads relation by id",
      description: "Update an existing chats-to-threads relation by id.",
      inputSchema: socialChatsToThreadsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialChatsToThreadsApi.update({
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
    "social-chats-to-threads-delete",
    {
      title: "Delete social chats-to-threads relation by id",
      description: "Delete an existing chats-to-threads relation by id.",
      inputSchema: socialChatsToThreadsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialChatsToThreadsApi.delete({
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
