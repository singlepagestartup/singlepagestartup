import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { insertSchema as ecommerceOrdersToBillingModulePaymentIntentsInsertSchema } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-orders-to-billing-module-payment-intents",
    "sps://ecommerce/orders-to-billing-module-payment-intents",
    {
      title: "ecommerce orders-to-billing-module-payment-intents relation",
      description:
        "Get list of all orders-to-billing-module-payment-intents relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceOrdersToBillingModulePaymentIntentsApi.find();

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
    "ecommerce-orders-to-billing-module-payment-intents-get",
    {
      title:
        "List of ecommerce orders-to-billing-module-payment-intents relations",
      description:
        "Get list of all orders-to-billing-module-payment-intents relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await ecommerceOrdersToBillingModulePaymentIntentsApi.find({
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
    "ecommerce-orders-to-billing-module-payment-intents-get-by-id",
    {
      title:
        "Get ecommerce orders-to-billing-module-payment-intents relation by id",
      description:
        "Get a orders-to-billing-module-payment-intents relation by id.",
      inputSchema: {
        id: ecommerceOrdersToBillingModulePaymentIntentsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceOrdersToBillingModulePaymentIntentsApi.findById({
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
    "ecommerce-orders-to-billing-module-payment-intents-post",
    {
      title:
        "Create ecommerce orders-to-billing-module-payment-intents relation",
      description:
        "Create a new orders-to-billing-module-payment-intents relation in the ecommerce module.",
      inputSchema:
        ecommerceOrdersToBillingModulePaymentIntentsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await ecommerceOrdersToBillingModulePaymentIntentsApi.create({
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
    "ecommerce-orders-to-billing-module-payment-intents-patch",
    {
      title:
        "Update ecommerce orders-to-billing-module-payment-intents relation by id",
      description:
        "Update an existing orders-to-billing-module-payment-intents relation by id.",
      inputSchema:
        ecommerceOrdersToBillingModulePaymentIntentsInsertSchema.shape,
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
          await ecommerceOrdersToBillingModulePaymentIntentsApi.update({
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
    "ecommerce-orders-to-billing-module-payment-intents-delete",
    {
      title:
        "Delete ecommerce orders-to-billing-module-payment-intents relation by id",
      description:
        "Delete an existing orders-to-billing-module-payment-intents relation by id.",
      inputSchema:
        ecommerceOrdersToBillingModulePaymentIntentsInsertSchema.shape,
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
          await ecommerceOrdersToBillingModulePaymentIntentsApi.delete({
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
