import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogCategoriesToWebsiteBuilderModuleWidgetsApi } from "@sps/blog/relations/categories-to-website-builder-module-widgets/sdk/server";
import { insertSchema as blogCategoriesToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/blog/relations/categories-to-website-builder-module-widgets/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-categories-to-website-builder-module-widgets",
    "sps://blog/categories-to-website-builder-module-widgets",
    {
      title: "blog categories-to-website-builder-module-widgets relation",
      description:
        "Get list of all categories-to-website-builder-module-widgets relations from blog module",
    },
    async (uri) => {
      const resp = await blogCategoriesToWebsiteBuilderModuleWidgetsApi.find();

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
    "blog-categories-to-website-builder-module-widgets-get",
    {
      title:
        "List of blog categories-to-website-builder-module-widgets relations",
      description:
        "Get list of all categories-to-website-builder-module-widgets relations from blog module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await blogCategoriesToWebsiteBuilderModuleWidgetsApi.find({
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
    "blog-categories-to-website-builder-module-widgets-get-by-id",
    {
      title:
        "Get blog categories-to-website-builder-module-widgets relation by id",
      description:
        "Get a categories-to-website-builder-module-widgets relation by id.",
      inputSchema: {
        id: blogCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await blogCategoriesToWebsiteBuilderModuleWidgetsApi.findById({
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
    "blog-categories-to-website-builder-module-widgets-post",
    {
      title:
        "Create blog categories-to-website-builder-module-widgets relation",
      description:
        "Create a new categories-to-website-builder-module-widgets relation in the blog module.",
      inputSchema:
        blogCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await blogCategoriesToWebsiteBuilderModuleWidgetsApi.create({
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
    "blog-categories-to-website-builder-module-widgets-patch",
    {
      title:
        "Update blog categories-to-website-builder-module-widgets relation by id",
      description:
        "Update an existing categories-to-website-builder-module-widgets relation by id.",
      inputSchema:
        blogCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
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
          await blogCategoriesToWebsiteBuilderModuleWidgetsApi.update({
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
    "blog-categories-to-website-builder-module-widgets-delete",
    {
      title:
        "Delete blog categories-to-website-builder-module-widgets relation by id",
      description:
        "Delete an existing categories-to-website-builder-module-widgets relation by id.",
      inputSchema:
        blogCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
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
          await blogCategoriesToWebsiteBuilderModuleWidgetsApi.delete({
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
