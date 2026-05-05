import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToWebsiteBuilderModuleWidgetsApi } from "@sps/social/relations/profiles-to-website-builder-module-widgets/sdk/server";
import { insertSchema as socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/social/relations/profiles-to-website-builder-module-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-website-builder-module-widgets",
    "sps://social/profiles-to-website-builder-module-widgets",
    {
      title: "social profiles-to-website-builder-module-widgets relation",
      description:
        "Get list of all profiles-to-website-builder-module-widgets relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToWebsiteBuilderModuleWidgetsApi.find({
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
    "social-profiles-to-website-builder-module-widgets-count",
    "Count social profiles to website builder module widgets",
    "Count social profiles to website builder module widgets entities with optional filters.",
    socialProfilesToWebsiteBuilderModuleWidgetsApi,
  );

  mcp.registerTool(
    "social-profiles-to-website-builder-module-widgets-get",
    {
      title:
        "List of social profiles-to-website-builder-module-widgets relations",
      description:
        "Get list of all profiles-to-website-builder-module-widgets relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.find({
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
    "social-profiles-to-website-builder-module-widgets-get-by-id",
    {
      title:
        "Get social profiles-to-website-builder-module-widgets relation by id",
      description:
        "Get a profiles-to-website-builder-module-widgets relation by id.",
      inputSchema: {
        id: socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.findById({
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
    "social-profiles-to-website-builder-module-widgets-post",
    {
      title:
        "Create social profiles-to-website-builder-module-widgets relation",
      description:
        "Create a new profiles-to-website-builder-module-widgets relation in the social module.",
      inputSchema:
        socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.create({
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
    "social-profiles-to-website-builder-module-widgets-patch",
    {
      title:
        "Update social profiles-to-website-builder-module-widgets relation by id",
      description:
        "Update an existing profiles-to-website-builder-module-widgets relation by id.",
      inputSchema:
        socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.update({
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
    "social-profiles-to-website-builder-module-widgets-delete",
    {
      title:
        "Delete social profiles-to-website-builder-module-widgets relation by id",
      description:
        "Delete an existing profiles-to-website-builder-module-widgets relation by id.",
      inputSchema:
        socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.delete({
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
