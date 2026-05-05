import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { insertSchema as ecommerceOrderInsertSchema } from "@sps/ecommerce/models/order/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-module-orders",
    "sps://ecommerce/orders",
    {
      title: "ecommerce module orders",
      description: "Get list of all orders from ecommerce module",
    },
    async (uri, extra) => {
      const resp = await ecommerceOrderApi.find({
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
    "ecommerce-module-order-count",
    "Count ecommerce module order",
    "Count ecommerce module order entities with optional filters.",
    ecommerceOrderApi,
  );

  mcp.registerTool(
    "ecommerce-module-order-get",
    {
      title: "List of ecommerce module orders",
      description: "Get list of all orders from ecommerce module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await ecommerceOrderApi.find({
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
    "ecommerce-module-order-get-by-id",
    {
      title: "Get ecommerce module order by id",
      description: "Get a order from ecommerce module by id.",
      inputSchema: {
        id: ecommerceOrderInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceOrderApi.findById({
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
    "ecommerce-module-order-post",
    {
      title: "Create ecommerce module order",
      description: "Create a new order in the ecommerce module.",
      inputSchema: ecommerceOrderInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await ecommerceOrderApi.create({
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
    "ecommerce-module-order-patch",
    {
      title: "Update ecommerce module order by id",
      description: "Update an existing order in the ecommerce module by id.",
      inputSchema: ecommerceOrderInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceOrderApi.update({
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
    "ecommerce-module-order-delete",
    {
      title: "Delete ecommerce module order by id",
      description: "Delete an existing order in the ecommerce module by id.",
      inputSchema: ecommerceOrderInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceOrderApi.delete({
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
