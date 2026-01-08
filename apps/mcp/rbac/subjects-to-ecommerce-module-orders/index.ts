import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { insertSchema as rbacSubjectsToEcommerceModuleOrdersInsertSchema } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-ecommerce-module-orders",
    "sps://rbac/subjects-to-ecommerce-module-orders",
    {
      title: "rbac subjects-to-ecommerce-module-orders relation",
      description:
        "Get list of all subjects-to-ecommerce-module-orders relations from rbac module",
    },
    async (uri) => {
      const resp = await rbacSubjectsToEcommerceModuleOrdersApi.find();

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
    "rbac-subjects-to-ecommerce-module-orders-get",
    {
      title: "List of rbac subjects-to-ecommerce-module-orders relations",
      description:
        "Get list of all subjects-to-ecommerce-module-orders relations from rbac module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await rbacSubjectsToEcommerceModuleOrdersApi.find({
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
    "rbac-subjects-to-ecommerce-module-orders-get-by-id",
    {
      title: "Get rbac subjects-to-ecommerce-module-orders relation by id",
      description: "Get a subjects-to-ecommerce-module-orders relation by id.",
      inputSchema: {
        id: rbacSubjectsToEcommerceModuleOrdersInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToEcommerceModuleOrdersApi.findById({
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
    "rbac-subjects-to-ecommerce-module-orders-post",
    {
      title: "Create rbac subjects-to-ecommerce-module-orders relation",
      description:
        "Create a new subjects-to-ecommerce-module-orders relation in the rbac module.",
      inputSchema: rbacSubjectsToEcommerceModuleOrdersInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToEcommerceModuleOrdersApi.create({
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
    "rbac-subjects-to-ecommerce-module-orders-patch",
    {
      title: "Update rbac subjects-to-ecommerce-module-orders relation by id",
      description:
        "Update an existing subjects-to-ecommerce-module-orders relation by id.",
      inputSchema: rbacSubjectsToEcommerceModuleOrdersInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToEcommerceModuleOrdersApi.update({
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
    "rbac-subjects-to-ecommerce-module-orders-delete",
    {
      title: "Delete rbac subjects-to-ecommerce-module-orders relation by id",
      description:
        "Delete an existing subjects-to-ecommerce-module-orders relation by id.",
      inputSchema: rbacSubjectsToEcommerceModuleOrdersInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToEcommerceModuleOrdersApi.delete({
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
