import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToActionsApi } from "@sps/social/relations/profiles-to-actions/sdk/server";
import { insertSchema as socialProfilesToActionsInsertSchema } from "@sps/social/relations/profiles-to-actions/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-actions",
    "sps://social/profiles-to-actions",
    {
      title: "social profiles-to-actions relation",
      description:
        "Get list of all profiles-to-actions relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToActionsApi.find({
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
    "social-profiles-to-actions-count",
    "Count social profiles to actions",
    "Count social profiles to actions entities with optional filters.",
    socialProfilesToActionsApi,
  );

  mcp.registerTool(
    "social-profiles-to-actions-get",
    {
      title: "List of social profiles-to-actions relations",
      description:
        "Get list of all profiles-to-actions relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToActionsApi.find({
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
    "social-profiles-to-actions-get-by-id",
    {
      title: "Get social profiles-to-actions relation by id",
      description: "Get a profiles-to-actions relation by id.",
      inputSchema: {
        id: socialProfilesToActionsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfilesToActionsApi.findById({
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
    "social-profiles-to-actions-post",
    {
      title: "Create social profiles-to-actions relation",
      description:
        "Create a new profiles-to-actions relation in the social module.",
      inputSchema: socialProfilesToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToActionsApi.create({
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
    "social-profiles-to-actions-patch",
    {
      title: "Update social profiles-to-actions relation by id",
      description: "Update an existing profiles-to-actions relation by id.",
      inputSchema: socialProfilesToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToActionsApi.update({
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
    "social-profiles-to-actions-delete",
    {
      title: "Delete social profiles-to-actions relation by id",
      description: "Delete an existing profiles-to-actions relation by id.",
      inputSchema: socialProfilesToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToActionsApi.delete({
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
