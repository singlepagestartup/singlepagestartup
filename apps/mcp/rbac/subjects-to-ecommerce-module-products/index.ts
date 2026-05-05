import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToEcommerceModuleProductsApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/sdk/server";
import { insertSchema as rbacSubjectsToEcommerceModuleProductsInsertSchema } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-ecommerce-module-products",
    "sps://rbac/subjects-to-ecommerce-module-products",
    {
      title: "rbac subjects-to-ecommerce-module-products relation",
      description:
        "Get list of all subjects-to-ecommerce-module-products relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToEcommerceModuleProductsApi.find({
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
    "rbac-subjects-to-ecommerce-module-products-count",
    "Count rbac subjects to ecommerce module products",
    "Count rbac subjects to ecommerce module products entities with optional filters.",
    rbacSubjectsToEcommerceModuleProductsApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-ecommerce-module-products-get",
    {
      title: "List of rbac subjects-to-ecommerce-module-products relations",
      description:
        "Get list of all subjects-to-ecommerce-module-products relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectsToEcommerceModuleProductsApi.find({
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
    "rbac-subjects-to-ecommerce-module-products-get-by-id",
    {
      title: "Get rbac subjects-to-ecommerce-module-products relation by id",
      description:
        "Get a subjects-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: rbacSubjectsToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToEcommerceModuleProductsApi.findById({
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
    "rbac-subjects-to-ecommerce-module-products-post",
    {
      title: "Create rbac subjects-to-ecommerce-module-products relation",
      description:
        "Create a new subjects-to-ecommerce-module-products relation in the rbac module.",
      inputSchema: rbacSubjectsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectsToEcommerceModuleProductsApi.create({
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
    "rbac-subjects-to-ecommerce-module-products-patch",
    {
      title: "Update rbac subjects-to-ecommerce-module-products relation by id",
      description:
        "Update an existing subjects-to-ecommerce-module-products relation by id.",
      inputSchema: rbacSubjectsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectsToEcommerceModuleProductsApi.update({
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
    "rbac-subjects-to-ecommerce-module-products-delete",
    {
      title: "Delete rbac subjects-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing subjects-to-ecommerce-module-products relation by id.",
      inputSchema: rbacSubjectsToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectsToEcommerceModuleProductsApi.delete({
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
