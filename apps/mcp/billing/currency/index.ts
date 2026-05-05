import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { insertSchema as billingCurrencyInsertSchema } from "@sps/billing/models/currency/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "billing-module-currencies",
    "sps://billing/currencies",
    {
      title: "billing module currencies",
      description: "Get list of all currencies from billing module",
    },
    async (uri, extra) => {
      const resp = await billingCurrencyApi.find({
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
    "billing-module-currency-count",
    "Count billing module currency",
    "Count billing module currency entities with optional filters.",
    billingCurrencyApi,
  );

  mcp.registerTool(
    "billing-module-currency-get",
    {
      title: "List of billing module currencies",
      description: "Get list of all currencies from billing module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await billingCurrencyApi.find({
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
    "billing-module-currency-get-by-id",
    {
      title: "Get billing module currency by id",
      description: "Get a currency from billing module by id.",
      inputSchema: {
        id: billingCurrencyInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await billingCurrencyApi.findById({
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
    "billing-module-currency-post",
    {
      title: "Create billing module currency",
      description: "Create a new currency in the billing module.",
      inputSchema: billingCurrencyInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await billingCurrencyApi.create({
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
    "billing-module-currency-patch",
    {
      title: "Update billing module currency by id",
      description: "Update an existing currency in the billing module by id.",
      inputSchema: billingCurrencyInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await billingCurrencyApi.update({
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
    "billing-module-currency-delete",
    {
      title: "Delete billing module currency by id",
      description: "Delete an existing currency in the billing module by id.",
      inputSchema: billingCurrencyInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await billingCurrencyApi.delete({
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
