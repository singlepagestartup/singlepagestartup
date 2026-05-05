import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as billingPaymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";
import { insertSchema as billingPaymentIntentsToCurrenciesInsertSchema } from "@sps/billing/relations/payment-intents-to-currencies/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "billing-relations-payment-intents-to-currencies",
    "sps://billing/payment-intents-to-currencies",
    {
      title: "billing payment-intents-to-currencies relation",
      description:
        "Get list of all payment-intents-to-currencies relations from billing module",
    },
    async (uri, extra) => {
      const resp = await billingPaymentIntentsToCurrenciesApi.find({
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
    "billing-payment-intents-to-currencies-count",
    "Count billing payment intents to currencies",
    "Count billing payment intents to currencies entities with optional filters.",
    billingPaymentIntentsToCurrenciesApi,
  );

  mcp.registerTool(
    "billing-payment-intents-to-currencies-get",
    {
      title: "List of billing payment-intents-to-currencies relations",
      description:
        "Get list of all payment-intents-to-currencies relations from billing module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await billingPaymentIntentsToCurrenciesApi.find({
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
    "billing-payment-intents-to-currencies-get-by-id",
    {
      title: "Get billing payment-intents-to-currencies relation by id",
      description: "Get a payment-intents-to-currencies relation by id.",
      inputSchema: {
        id: billingPaymentIntentsToCurrenciesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await billingPaymentIntentsToCurrenciesApi.findById({
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
    "billing-payment-intents-to-currencies-post",
    {
      title: "Create billing payment-intents-to-currencies relation",
      description:
        "Create a new payment-intents-to-currencies relation in the billing module.",
      inputSchema: billingPaymentIntentsToCurrenciesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await billingPaymentIntentsToCurrenciesApi.create({
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
    "billing-payment-intents-to-currencies-patch",
    {
      title: "Update billing payment-intents-to-currencies relation by id",
      description:
        "Update an existing payment-intents-to-currencies relation by id.",
      inputSchema: billingPaymentIntentsToCurrenciesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await billingPaymentIntentsToCurrenciesApi.update({
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
    "billing-payment-intents-to-currencies-delete",
    {
      title: "Delete billing payment-intents-to-currencies relation by id",
      description:
        "Delete an existing payment-intents-to-currencies relation by id.",
      inputSchema: billingPaymentIntentsToCurrenciesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await billingPaymentIntentsToCurrenciesApi.delete({
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
