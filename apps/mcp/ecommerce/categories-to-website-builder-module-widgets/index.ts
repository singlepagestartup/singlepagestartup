import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/server";
import { insertSchema as ecommerceCategoriesToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-categories-to-website-builder-module-widgets",
    "sps://ecommerce/categories-to-website-builder-module-widgets",
    {
      title: "ecommerce categories-to-website-builder-module-widgets relation",
      description:
        "Get list of all categories-to-website-builder-module-widgets relations from ecommerce module",
    },
    async (uri) => {
      const resp =
        await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.find();

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
    "ecommerce-categories-to-website-builder-module-widgets-get",
    {
      title:
        "List of ecommerce categories-to-website-builder-module-widgets relations",
      description:
        "Get list of all categories-to-website-builder-module-widgets relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.find({
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
    "ecommerce-categories-to-website-builder-module-widgets-get-by-id",
    {
      title:
        "Get ecommerce categories-to-website-builder-module-widgets relation by id",
      description:
        "Get a categories-to-website-builder-module-widgets relation by id.",
      inputSchema: {
        id: ecommerceCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape
          .id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.findById({
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
    "ecommerce-categories-to-website-builder-module-widgets-post",
    {
      title:
        "Create ecommerce categories-to-website-builder-module-widgets relation",
      description:
        "Create a new categories-to-website-builder-module-widgets relation in the ecommerce module.",
      inputSchema:
        ecommerceCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.create({
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
    "ecommerce-categories-to-website-builder-module-widgets-patch",
    {
      title:
        "Update ecommerce categories-to-website-builder-module-widgets relation by id",
      description:
        "Update an existing categories-to-website-builder-module-widgets relation by id.",
      inputSchema:
        ecommerceCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
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
          await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.update({
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
    "ecommerce-categories-to-website-builder-module-widgets-delete",
    {
      title:
        "Delete ecommerce categories-to-website-builder-module-widgets relation by id",
      description:
        "Delete an existing categories-to-website-builder-module-widgets relation by id.",
      inputSchema:
        ecommerceCategoriesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
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
          await ecommerceCategoriesToWebsiteBuilderModuleWidgetsApi.delete({
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
