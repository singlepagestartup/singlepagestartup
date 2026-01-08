import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticlesToEcommerceModuleProductsApi } from "@sps/blog/relations/articles-to-ecommerce-module-products/sdk/server";
import { insertSchema as blogArticlesToEcommerceModuleProductsInsertSchema } from "@sps/blog/relations/articles-to-ecommerce-module-products/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-articles-to-ecommerce-module-products",
    "sps://blog/articles-to-ecommerce-module-products",
    {
      title: "blog articles-to-ecommerce-module-products relation",
      description:
        "Get list of all articles-to-ecommerce-module-products relations from blog module",
    },
    async (uri) => {
      const resp = await blogArticlesToEcommerceModuleProductsApi.find();

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
    "blog-articles-to-ecommerce-module-products-get",
    {
      title: "List of blog articles-to-ecommerce-module-products relations",
      description:
        "Get list of all articles-to-ecommerce-module-products relations from blog module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await blogArticlesToEcommerceModuleProductsApi.find({
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
    "blog-articles-to-ecommerce-module-products-get-by-id",
    {
      title: "Get blog articles-to-ecommerce-module-products relation by id",
      description:
        "Get a articles-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: blogArticlesToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.findById({
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
    "blog-articles-to-ecommerce-module-products-post",
    {
      title: "Create blog articles-to-ecommerce-module-products relation",
      description:
        "Create a new articles-to-ecommerce-module-products relation in the blog module.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.create({
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
    "blog-articles-to-ecommerce-module-products-patch",
    {
      title: "Update blog articles-to-ecommerce-module-products relation by id",
      description:
        "Update an existing articles-to-ecommerce-module-products relation by id.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.update({
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
    "blog-articles-to-ecommerce-module-products-delete",
    {
      title: "Delete blog articles-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing articles-to-ecommerce-module-products relation by id.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.delete({
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
