import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/server";
import { insertSchema as socialProfileInsertSchema } from "@sps/social/models/profile/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-profiles",
    "sps://social/profiles",
    {
      title: "social module profiles",
      description: "Get list of all profiles from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfileApi.find({
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
    "social-module-profile-count",
    "Count social module profile",
    "Count social module profile entities with optional filters.",
    socialProfileApi,
  );

  mcp.registerTool(
    "social-module-profile-get",
    {
      title: "List of social module profiles",
      description: "Get list of all profiles from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfileApi.find({
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
    "social-module-profile-get-by-id",
    {
      title: "Get social module profile by id",
      description: "Get a profile from social module by id.",
      inputSchema: {
        id: socialProfileInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfileApi.findById({
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
    "social-module-profile-post",
    {
      title: "Create social module profile",
      description: "Create a new profile in the social module.",
      inputSchema: socialProfileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfileApi.create({
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
    "social-module-profile-patch",
    {
      title: "Update social module profile by id",
      description: "Update an existing profile in the social module by id.",
      inputSchema: socialProfileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfileApi.update({
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
    "social-module-profile-delete",
    {
      title: "Delete social module profile by id",
      description: "Delete an existing profile in the social module by id.",
      inputSchema: socialProfileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfileApi.delete({
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
