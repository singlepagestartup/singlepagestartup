import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialThreadsToEcommerceModuleProductsApi } from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/server";
import { insertSchema as socialThreadsToEcommerceModuleProductsInsertSchema } from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-threads-to-ecommerce-module-products",
    "sps://social/threads-to-ecommerce-module-products",
    {
      title: "social threads-to-ecommerce-module-products relation",
      description:
        "Get list of all threads-to-ecommerce-module-products relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialThreadsToEcommerceModuleProductsApi.find({
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
    "social-threads-to-ecommerce-module-products-count",
    "Count social threads to ecommerce module products",
    "Count social threads to ecommerce module products entities with optional filters.",
    socialThreadsToEcommerceModuleProductsApi,
  );

  mcp.registerTool(
    "social-threads-to-ecommerce-module-products-get",
    {
      title: "List of social threads-to-ecommerce-module-products relations",
      description:
        "Get list of all threads-to-ecommerce-module-products relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialThreadsToEcommerceModuleProductsApi.find({
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
    "social-threads-to-ecommerce-module-products-get-by-id",
    {
      title: "Get social threads-to-ecommerce-module-products relation by id",
      description: "Get a threads-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: socialThreadsToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.findById(
          {
            id: args.id,
          },
        );

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
    "social-threads-to-ecommerce-module-products-post",
    {
      title: "Create social threads-to-ecommerce-module-products relation",
      description:
        "Create a new threads-to-ecommerce-module-products relation in the social module.",
      inputSchema: socialThreadsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialThreadsToEcommerceModuleProductsApi.create({
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
    "social-threads-to-ecommerce-module-products-patch",
    {
      title:
        "Update social threads-to-ecommerce-module-products relation by id",
      description:
        "Update an existing threads-to-ecommerce-module-products relation by id.",
      inputSchema: socialThreadsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.update({
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
    "social-threads-to-ecommerce-module-products-delete",
    {
      title:
        "Delete social threads-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing threads-to-ecommerce-module-products relation by id.",
      inputSchema: socialThreadsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.delete({
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
