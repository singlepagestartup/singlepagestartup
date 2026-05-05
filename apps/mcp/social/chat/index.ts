import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialChatApi } from "@sps/social/models/chat/sdk/server";
import { insertSchema as socialChatInsertSchema } from "@sps/social/models/chat/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-chats",
    "sps://social/chats",
    {
      title: "social module chats",
      description: "Get list of all chats from social module",
    },
    async (uri, extra) => {
      const resp = await socialChatApi.find({
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
    "social-module-chat-count",
    "Count social module chat",
    "Count social module chat entities with optional filters.",
    socialChatApi,
  );

  mcp.registerTool(
    "social-module-chat-get",
    {
      title: "List of social module chats",
      description: "Get list of all chats from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialChatApi.find({
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
    "social-module-chat-get-by-id",
    {
      title: "Get social module chat by id",
      description: "Get a chat from social module by id.",
      inputSchema: {
        id: socialChatInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialChatApi.findById({
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
    "social-module-chat-post",
    {
      title: "Create social module chat",
      description: "Create a new chat in the social module.",
      inputSchema: socialChatInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialChatApi.create({
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
    "social-module-chat-patch",
    {
      title: "Update social module chat by id",
      description: "Update an existing chat in the social module by id.",
      inputSchema: socialChatInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialChatApi.update({
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
    "social-module-chat-delete",
    {
      title: "Delete social module chat by id",
      description: "Delete an existing chat in the social module by id.",
      inputSchema: socialChatInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialChatApi.delete({
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
