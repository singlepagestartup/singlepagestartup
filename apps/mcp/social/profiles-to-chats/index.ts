import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { insertSchema as socialProfilesToChatsInsertSchema } from "@sps/social/relations/profiles-to-chats/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-chats",
    "sps://social/profiles-to-chats",
    {
      title: "social profiles-to-chats relation",
      description:
        "Get list of all profiles-to-chats relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToChatsApi.find({
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
    "social-profiles-to-chats-count",
    "Count social profiles to chats",
    "Count social profiles to chats entities with optional filters.",
    socialProfilesToChatsApi,
  );

  mcp.registerTool(
    "social-profiles-to-chats-get",
    {
      title: "List of social profiles-to-chats relations",
      description:
        "Get list of all profiles-to-chats relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToChatsApi.find({
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
    "social-profiles-to-chats-get-by-id",
    {
      title: "Get social profiles-to-chats relation by id",
      description: "Get a profiles-to-chats relation by id.",
      inputSchema: {
        id: socialProfilesToChatsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfilesToChatsApi.findById({
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
    "social-profiles-to-chats-post",
    {
      title: "Create social profiles-to-chats relation",
      description:
        "Create a new profiles-to-chats relation in the social module.",
      inputSchema: socialProfilesToChatsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToChatsApi.create({
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
    "social-profiles-to-chats-patch",
    {
      title: "Update social profiles-to-chats relation by id",
      description: "Update an existing profiles-to-chats relation by id.",
      inputSchema: socialProfilesToChatsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToChatsApi.update({
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
    "social-profiles-to-chats-delete",
    {
      title: "Delete social profiles-to-chats relation by id",
      description: "Delete an existing profiles-to-chats relation by id.",
      inputSchema: socialProfilesToChatsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToChatsApi.delete({
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
