import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceAttributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { insertSchema as ecommerceAttributesToBillingModuleCurrenciesInsertSchema } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-attributes-to-billing-module-currencies",
    "sps://ecommerce/attributes-to-billing-module-currencies",
    {
      title: "ecommerce attributes-to-billing-module-currencies relation",
      description:
        "Get list of all attributes-to-billing-module-currencies relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceAttributesToBillingModuleCurrenciesApi.find();

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
    "ecommerce-attributes-to-billing-module-currencies-get",
    {
      title:
        "List of ecommerce attributes-to-billing-module-currencies relations",
      description:
        "Get list of all attributes-to-billing-module-currencies relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await ecommerceAttributesToBillingModuleCurrenciesApi.find({
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
    "ecommerce-attributes-to-billing-module-currencies-get-by-id",
    {
      title:
        "Get ecommerce attributes-to-billing-module-currencies relation by id",
      description:
        "Get a attributes-to-billing-module-currencies relation by id.",
      inputSchema: {
        id: ecommerceAttributesToBillingModuleCurrenciesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceAttributesToBillingModuleCurrenciesApi.findById({
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
    "ecommerce-attributes-to-billing-module-currencies-post",
    {
      title:
        "Create ecommerce attributes-to-billing-module-currencies relation",
      description:
        "Create a new attributes-to-billing-module-currencies relation in the ecommerce module.",
      inputSchema:
        ecommerceAttributesToBillingModuleCurrenciesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await ecommerceAttributesToBillingModuleCurrenciesApi.create({
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
    "ecommerce-attributes-to-billing-module-currencies-patch",
    {
      title:
        "Update ecommerce attributes-to-billing-module-currencies relation by id",
      description:
        "Update an existing attributes-to-billing-module-currencies relation by id.",
      inputSchema:
        ecommerceAttributesToBillingModuleCurrenciesInsertSchema.shape,
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
          await ecommerceAttributesToBillingModuleCurrenciesApi.update({
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
    "ecommerce-attributes-to-billing-module-currencies-delete",
    {
      title:
        "Delete ecommerce attributes-to-billing-module-currencies relation by id",
      description:
        "Delete an existing attributes-to-billing-module-currencies relation by id.",
      inputSchema:
        ecommerceAttributesToBillingModuleCurrenciesInsertSchema.shape,
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
          await ecommerceAttributesToBillingModuleCurrenciesApi.delete({
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
