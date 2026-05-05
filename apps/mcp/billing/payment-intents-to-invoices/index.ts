import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { insertSchema as billingPaymentIntentsToInvoicesInsertSchema } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "billing-relations-payment-intents-to-invoices",
    "sps://billing/payment-intents-to-invoices",
    {
      title: "billing payment-intents-to-invoices relation",
      description:
        "Get list of all payment-intents-to-invoices relations from billing module",
    },
    async (uri, extra) => {
      const resp = await billingPaymentIntentsToInvoicesApi.find({
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
    "billing-payment-intents-to-invoices-count",
    "Count billing payment intents to invoices",
    "Count billing payment intents to invoices entities with optional filters.",
    billingPaymentIntentsToInvoicesApi,
  );

  mcp.registerTool(
    "billing-payment-intents-to-invoices-get",
    {
      title: "List of billing payment-intents-to-invoices relations",
      description:
        "Get list of all payment-intents-to-invoices relations from billing module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await billingPaymentIntentsToInvoicesApi.find({
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
    "billing-payment-intents-to-invoices-get-by-id",
    {
      title: "Get billing payment-intents-to-invoices relation by id",
      description: "Get a payment-intents-to-invoices relation by id.",
      inputSchema: {
        id: billingPaymentIntentsToInvoicesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.findById({
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
    "billing-payment-intents-to-invoices-post",
    {
      title: "Create billing payment-intents-to-invoices relation",
      description:
        "Create a new payment-intents-to-invoices relation in the billing module.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await billingPaymentIntentsToInvoicesApi.create({
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
    "billing-payment-intents-to-invoices-patch",
    {
      title: "Update billing payment-intents-to-invoices relation by id",
      description:
        "Update an existing payment-intents-to-invoices relation by id.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.update({
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
    "billing-payment-intents-to-invoices-delete",
    {
      title: "Delete billing payment-intents-to-invoices relation by id",
      description:
        "Delete an existing payment-intents-to-invoices relation by id.",
      inputSchema: billingPaymentIntentsToInvoicesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await billingPaymentIntentsToInvoicesApi.delete({
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
