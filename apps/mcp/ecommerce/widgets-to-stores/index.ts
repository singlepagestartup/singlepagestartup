import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceWidgetsToStoresApi } from "@sps/ecommerce/relations/widgets-to-stores/sdk/server";
import { insertSchema as ecommerceWidgetsToStoresInsertSchema } from "@sps/ecommerce/relations/widgets-to-stores/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-widgets-to-stores",
    "sps://ecommerce/widgets-to-stores",
    {
      title: "ecommerce widgets-to-stores relation",
      description:
        "Get list of all widgets-to-stores relations from ecommerce module",
    },
    async (uri, extra) => {
      const resp = await ecommerceWidgetsToStoresApi.find({
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
    "ecommerce-widgets-to-stores-count",
    "Count ecommerce widgets to stores",
    "Count ecommerce widgets to stores entities with optional filters.",
    ecommerceWidgetsToStoresApi,
  );

  mcp.registerTool(
    "ecommerce-widgets-to-stores-get",
    {
      title: "List of ecommerce widgets-to-stores relations",
      description:
        "Get list of all widgets-to-stores relations from ecommerce module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await ecommerceWidgetsToStoresApi.find({
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
    "ecommerce-widgets-to-stores-get-by-id",
    {
      title: "Get ecommerce widgets-to-stores relation by id",
      description: "Get a widgets-to-stores relation by id.",
      inputSchema: {
        id: ecommerceWidgetsToStoresInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceWidgetsToStoresApi.findById({
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
    "ecommerce-widgets-to-stores-post",
    {
      title: "Create ecommerce widgets-to-stores relation",
      description:
        "Create a new widgets-to-stores relation in the ecommerce module.",
      inputSchema: ecommerceWidgetsToStoresInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await ecommerceWidgetsToStoresApi.create({
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
    "ecommerce-widgets-to-stores-patch",
    {
      title: "Update ecommerce widgets-to-stores relation by id",
      description: "Update an existing widgets-to-stores relation by id.",
      inputSchema: ecommerceWidgetsToStoresInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceWidgetsToStoresApi.update({
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
    "ecommerce-widgets-to-stores-delete",
    {
      title: "Delete ecommerce widgets-to-stores relation by id",
      description: "Delete an existing widgets-to-stores relation by id.",
      inputSchema: ecommerceWidgetsToStoresInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceWidgetsToStoresApi.delete({
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
