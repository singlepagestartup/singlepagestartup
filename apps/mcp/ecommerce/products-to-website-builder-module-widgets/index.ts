import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceProductsToWebsiteBuilderModuleWidgetsApi } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/server";
import { insertSchema as ecommerceProductsToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-products-to-website-builder-module-widgets",
    "sps://ecommerce/products-to-website-builder-module-widgets",
    {
      title: "ecommerce products-to-website-builder-module-widgets relation",
      description:
        "Get list of all products-to-website-builder-module-widgets relations from ecommerce module",
    },
    async (uri, extra) => {
      const resp =
        await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.find();

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
    "ecommerce-products-to-website-builder-module-widgets-count",
    "Count ecommerce products to website builder module widgets",
    "Count ecommerce products to website builder module widgets entities with optional filters.",
    ecommerceProductsToWebsiteBuilderModuleWidgetsApi,
  );

  mcp.registerTool(
    "ecommerce-products-to-website-builder-module-widgets-get",
    {
      title:
        "List of ecommerce products-to-website-builder-module-widgets relations",
      description:
        "Get list of all products-to-website-builder-module-widgets relations from ecommerce module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.find({
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
    "ecommerce-products-to-website-builder-module-widgets-get-by-id",
    {
      title:
        "Get ecommerce products-to-website-builder-module-widgets relation by id",
      description:
        "Get a products-to-website-builder-module-widgets relation by id.",
      inputSchema: {
        id: ecommerceProductsToWebsiteBuilderModuleWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.findById({
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
    "ecommerce-products-to-website-builder-module-widgets-post",
    {
      title:
        "Create ecommerce products-to-website-builder-module-widgets relation",
      description:
        "Create a new products-to-website-builder-module-widgets relation in the ecommerce module.",
      inputSchema:
        ecommerceProductsToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.create({
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
    "ecommerce-products-to-website-builder-module-widgets-patch",
    {
      title:
        "Update ecommerce products-to-website-builder-module-widgets relation by id",
      description:
        "Update an existing products-to-website-builder-module-widgets relation by id.",
      inputSchema:
        ecommerceProductsToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.update({
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
    "ecommerce-products-to-website-builder-module-widgets-delete",
    {
      title:
        "Delete ecommerce products-to-website-builder-module-widgets relation by id",
      description:
        "Delete an existing products-to-website-builder-module-widgets relation by id.",
      inputSchema:
        ecommerceProductsToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await ecommerceProductsToWebsiteBuilderModuleWidgetsApi.delete({
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
