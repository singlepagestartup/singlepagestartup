import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { insertSchema as socialThreadsToMessagesInsertSchema } from "@sps/social/relations/threads-to-messages/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-threads-to-messages",
    "sps://social/threads-to-messages",
    {
      title: "social threads-to-messages relation",
      description:
        "Get list of all threads-to-messages relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialThreadsToMessagesApi.find({
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
    "social-threads-to-messages-count",
    "Count social threads to messages",
    "Count social threads to messages entities with optional filters.",
    socialThreadsToMessagesApi,
  );

  mcp.registerTool(
    "social-threads-to-messages-get",
    {
      title: "List of social threads-to-messages relations",
      description:
        "Get list of all threads-to-messages relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialThreadsToMessagesApi.find({
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
    "social-threads-to-messages-get-by-id",
    {
      title: "Get social threads-to-messages relation by id",
      description: "Get a threads-to-messages relation by id.",
      inputSchema: {
        id: socialThreadsToMessagesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialThreadsToMessagesApi.findById({
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
    "social-threads-to-messages-post",
    {
      title: "Create social threads-to-messages relation",
      description:
        "Create a new threads-to-messages relation in the social module.",
      inputSchema: socialThreadsToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialThreadsToMessagesApi.create({
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
    "social-threads-to-messages-patch",
    {
      title: "Update social threads-to-messages relation by id",
      description: "Update an existing threads-to-messages relation by id.",
      inputSchema: socialThreadsToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialThreadsToMessagesApi.update({
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
    "social-threads-to-messages-delete",
    {
      title: "Delete social threads-to-messages relation by id",
      description: "Delete an existing threads-to-messages relation by id.",
      inputSchema: socialThreadsToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialThreadsToMessagesApi.delete({
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
