import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialThreadsToEcommerceModuleProductsApi } from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/server";
import { insertSchema as socialThreadsToEcommerceModuleProductsInsertSchema } from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-threads-to-ecommerce-module-products",
    "sps://social/threads-to-ecommerce-module-products",
    {
      title: "social threads-to-ecommerce-module-products relation",
      description:
        "Get list of all threads-to-ecommerce-module-products relations from social module",
    },
    async (uri) => {
      const resp = await socialThreadsToEcommerceModuleProductsApi.find();

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
    "social-threads-to-ecommerce-module-products-get",
    {
      title: "List of social threads-to-ecommerce-module-products relations",
      description:
        "Get list of all threads-to-ecommerce-module-products relations from social module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await socialThreadsToEcommerceModuleProductsApi.find({
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
    "social-threads-to-ecommerce-module-products-get-by-id",
    {
      title: "Get social threads-to-ecommerce-module-products relation by id",
      description: "Get a threads-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: socialThreadsToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args) => {
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
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.create({
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
    "social-threads-to-ecommerce-module-products-patch",
    {
      title:
        "Update social threads-to-ecommerce-module-products relation by id",
      description:
        "Update an existing threads-to-ecommerce-module-products relation by id.",
      inputSchema: socialThreadsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.update({
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
    "social-threads-to-ecommerce-module-products-delete",
    {
      title:
        "Delete social threads-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing threads-to-ecommerce-module-products relation by id.",
      inputSchema: socialThreadsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialThreadsToEcommerceModuleProductsApi.delete({
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
