import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticlesToEcommerceModuleProductsApi } from "@sps/blog/relations/articles-to-ecommerce-module-products/sdk/server";
import { insertSchema as blogArticlesToEcommerceModuleProductsInsertSchema } from "@sps/blog/relations/articles-to-ecommerce-module-products/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-articles-to-ecommerce-module-products",
    "sps://blog/articles-to-ecommerce-module-products",
    {
      title: "blog articles-to-ecommerce-module-products relation",
      description:
        "Get list of all articles-to-ecommerce-module-products relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogArticlesToEcommerceModuleProductsApi.find({
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
    "blog-articles-to-ecommerce-module-products-count",
    "Count blog articles to ecommerce module products",
    "Count blog articles to ecommerce module products entities with optional filters.",
    blogArticlesToEcommerceModuleProductsApi,
  );

  mcp.registerTool(
    "blog-articles-to-ecommerce-module-products-get",
    {
      title: "List of blog articles-to-ecommerce-module-products relations",
      description:
        "Get list of all articles-to-ecommerce-module-products relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogArticlesToEcommerceModuleProductsApi.find({
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
    "blog-articles-to-ecommerce-module-products-get-by-id",
    {
      title: "Get blog articles-to-ecommerce-module-products relation by id",
      description:
        "Get a articles-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: blogArticlesToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.findById({
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
    "blog-articles-to-ecommerce-module-products-post",
    {
      title: "Create blog articles-to-ecommerce-module-products relation",
      description:
        "Create a new articles-to-ecommerce-module-products relation in the blog module.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogArticlesToEcommerceModuleProductsApi.create({
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
    "blog-articles-to-ecommerce-module-products-patch",
    {
      title: "Update blog articles-to-ecommerce-module-products relation by id",
      description:
        "Update an existing articles-to-ecommerce-module-products relation by id.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.update({
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
    "blog-articles-to-ecommerce-module-products-delete",
    {
      title: "Delete blog articles-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing articles-to-ecommerce-module-products relation by id.",
      inputSchema: blogArticlesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogArticlesToEcommerceModuleProductsApi.delete({
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
