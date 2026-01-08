import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { insertSchema as billingPaymentIntentsToInvoicesInsertSchema } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "billing-relations-payment-intents-to-invoices",
    "sps://billing/payment-intents-to-invoices",
    {
      title: "billing payment-intents-to-invoices relation",
      description:
        "Get list of all payment-intents-to-invoices relations from billing module",
    },
    async (uri) => {
      const resp = await billingPaymentIntentsToInvoicesApi.find();

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
    "billing-payment-intents-to-invoices-get",
    {
      title: "List of billing payment-intents-to-invoices relations",
      description:
        "Get list of all payment-intents-to-invoices relations from billing module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await billingPaymentIntentsToInvoicesApi.find({
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
    "billing-payment-intents-to-invoices-get-by-id",
    {
      title: "Get billing payment-intents-to-invoices relation by id",
      description: "Get a payment-intents-to-invoices relation by id.",
      inputSchema: {
        id: billingPaymentIntentsToInvoicesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.findById({
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
    "billing-payment-intents-to-invoices-post",
    {
      title: "Create billing payment-intents-to-invoices relation",
      description:
        "Create a new payment-intents-to-invoices relation in the billing module.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.create({
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
    "billing-payment-intents-to-invoices-patch",
    {
      title: "Update billing payment-intents-to-invoices relation by id",
      description:
        "Update an existing payment-intents-to-invoices relation by id.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.update({
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
    "billing-payment-intents-to-invoices-delete",
    {
      title: "Delete billing payment-intents-to-invoices relation by id",
      description:
        "Delete an existing payment-intents-to-invoices relation by id.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.delete({
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
