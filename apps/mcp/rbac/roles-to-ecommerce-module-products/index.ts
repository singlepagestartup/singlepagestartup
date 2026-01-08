import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacRolesToEcommerceModuleProductsApi } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/server";
import { insertSchema as rbacRolesToEcommerceModuleProductsInsertSchema } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-roles-to-ecommerce-module-products",
    "sps://rbac/roles-to-ecommerce-module-products",
    {
      title: "rbac roles-to-ecommerce-module-products relation",
      description:
        "Get list of all roles-to-ecommerce-module-products relations from rbac module",
    },
    async (uri) => {
      const resp = await rbacRolesToEcommerceModuleProductsApi.find();

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
    "rbac-roles-to-ecommerce-module-products-get",
    {
      title: "List of rbac roles-to-ecommerce-module-products relations",
      description:
        "Get list of all roles-to-ecommerce-module-products relations from rbac module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await rbacRolesToEcommerceModuleProductsApi.find({
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
    "rbac-roles-to-ecommerce-module-products-get-by-id",
    {
      title: "Get rbac roles-to-ecommerce-module-products relation by id",
      description: "Get a roles-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: rbacRolesToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacRolesToEcommerceModuleProductsApi.findById({
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
    "rbac-roles-to-ecommerce-module-products-post",
    {
      title: "Create rbac roles-to-ecommerce-module-products relation",
      description:
        "Create a new roles-to-ecommerce-module-products relation in the rbac module.",
      inputSchema: rbacRolesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacRolesToEcommerceModuleProductsApi.create({
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
    "rbac-roles-to-ecommerce-module-products-patch",
    {
      title: "Update rbac roles-to-ecommerce-module-products relation by id",
      description:
        "Update an existing roles-to-ecommerce-module-products relation by id.",
      inputSchema: rbacRolesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacRolesToEcommerceModuleProductsApi.update({
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
    "rbac-roles-to-ecommerce-module-products-delete",
    {
      title: "Delete rbac roles-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing roles-to-ecommerce-module-products relation by id.",
      inputSchema: rbacRolesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacRolesToEcommerceModuleProductsApi.delete({
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
