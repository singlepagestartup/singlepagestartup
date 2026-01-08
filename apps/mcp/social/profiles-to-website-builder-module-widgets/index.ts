import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToWebsiteBuilderModuleWidgetsApi } from "@sps/social/relations/profiles-to-website-builder-module-widgets/sdk/server";
import { insertSchema as socialProfilesToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/social/relations/profiles-to-website-builder-module-widgets/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-website-builder-module-widgets",
    "sps://social/profiles-to-website-builder-module-widgets",
    {
      title: "social profiles-to-website-builder-module-widgets relation",
      description:
        "Get list of all profiles-to-website-builder-module-widgets relations from social module",
    },
    async (uri) => {
      const resp = await socialProfilesToWebsiteBuilderModuleWidgetsApi.find();

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
  mcp.registerTool(
    "social-profiles-to-website-builder-module-widgets-get",
    {
      title:
        "List of social profiles-to-website-builder-module-widgets relations",
      description:
        "Get list of all profiles-to-website-builder-module-widgets relations from social module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.find({
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.findById({
            id: args.id,
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
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.create({
            data: args,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.update({
            id: args.id,
            data: args,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await socialProfilesToWebsiteBuilderModuleWidgetsApi.delete({
            id: args.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
