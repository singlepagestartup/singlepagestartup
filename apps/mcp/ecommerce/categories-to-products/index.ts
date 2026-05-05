import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceCategoriesToProductsApi } from "@sps/ecommerce/relations/categories-to-products/sdk/server";
import { insertSchema as ecommerceCategoriesToProductsInsertSchema } from "@sps/ecommerce/relations/categories-to-products/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-categories-to-products",
    "sps://ecommerce/categories-to-products",
    {
      title: "ecommerce categories-to-products relation",
      description:
        "Get list of all categories-to-products relations from ecommerce module",
    },
    async (uri, extra) => {
      const resp = await ecommerceCategoriesToProductsApi.find({
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
    "ecommerce-categories-to-products-count",
    "Count ecommerce categories to products",
    "Count ecommerce categories to products entities with optional filters.",
    ecommerceCategoriesToProductsApi,
  );

  mcp.registerTool(
    "ecommerce-categories-to-products-get",
    {
      title: "List of ecommerce categories-to-products relations",
      description:
        "Get list of all categories-to-products relations from ecommerce module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await ecommerceCategoriesToProductsApi.find({
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
    "ecommerce-categories-to-products-get-by-id",
    {
      title: "Get ecommerce categories-to-products relation by id",
      description: "Get a categories-to-products relation by id.",
      inputSchema: {
        id: ecommerceCategoriesToProductsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceCategoriesToProductsApi.findById({
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
    "ecommerce-categories-to-products-post",
    {
      title: "Create ecommerce categories-to-products relation",
      description:
        "Create a new categories-to-products relation in the ecommerce module.",
      inputSchema: ecommerceCategoriesToProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await ecommerceCategoriesToProductsApi.create({
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
    "ecommerce-categories-to-products-patch",
    {
      title: "Update ecommerce categories-to-products relation by id",
      description: "Update an existing categories-to-products relation by id.",
      inputSchema: ecommerceCategoriesToProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceCategoriesToProductsApi.update({
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
    "ecommerce-categories-to-products-delete",
    {
      title: "Delete ecommerce categories-to-products relation by id",
      description: "Delete an existing categories-to-products relation by id.",
      inputSchema: ecommerceCategoriesToProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceCategoriesToProductsApi.delete({
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
