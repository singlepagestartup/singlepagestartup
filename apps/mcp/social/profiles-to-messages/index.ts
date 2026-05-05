import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { insertSchema as socialProfilesToMessagesInsertSchema } from "@sps/social/relations/profiles-to-messages/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-messages",
    "sps://social/profiles-to-messages",
    {
      title: "social profiles-to-messages relation",
      description:
        "Get list of all profiles-to-messages relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToMessagesApi.find({
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
    "social-profiles-to-messages-count",
    "Count social profiles to messages",
    "Count social profiles to messages entities with optional filters.",
    socialProfilesToMessagesApi,
  );

  mcp.registerTool(
    "social-profiles-to-messages-get",
    {
      title: "List of social profiles-to-messages relations",
      description:
        "Get list of all profiles-to-messages relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToMessagesApi.find({
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
    "social-profiles-to-messages-get-by-id",
    {
      title: "Get social profiles-to-messages relation by id",
      description: "Get a profiles-to-messages relation by id.",
      inputSchema: {
        id: socialProfilesToMessagesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfilesToMessagesApi.findById({
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
    "social-profiles-to-messages-post",
    {
      title: "Create social profiles-to-messages relation",
      description:
        "Create a new profiles-to-messages relation in the social module.",
      inputSchema: socialProfilesToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToMessagesApi.create({
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
    "social-profiles-to-messages-patch",
    {
      title: "Update social profiles-to-messages relation by id",
      description: "Update an existing profiles-to-messages relation by id.",
      inputSchema: socialProfilesToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToMessagesApi.update({
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
    "social-profiles-to-messages-delete",
    {
      title: "Delete social profiles-to-messages relation by id",
      description: "Delete an existing profiles-to-messages relation by id.",
      inputSchema: socialProfilesToMessagesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToMessagesApi.delete({
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
