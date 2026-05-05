import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceOrdersToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/server";
import { insertSchema as ecommerceOrdersToFileStorageModuleFilesInsertSchema } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-orders-to-file-storage-module-files",
    "sps://ecommerce/orders-to-file-storage-module-files",
    {
      title: "ecommerce orders-to-file-storage-module-files relation",
      description:
        "Get list of all orders-to-file-storage-module-files relations from ecommerce module",
    },
    async (uri, extra) => {
      const resp = await ecommerceOrdersToFileStorageModuleFilesApi.find({
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
    "ecommerce-orders-to-file-storage-module-files-count",
    "Count ecommerce orders to file storage module files",
    "Count ecommerce orders to file storage module files entities with optional filters.",
    ecommerceOrdersToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "ecommerce-orders-to-file-storage-module-files-get",
    {
      title: "List of ecommerce orders-to-file-storage-module-files relations",
      description:
        "Get list of all orders-to-file-storage-module-files relations from ecommerce module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await ecommerceOrdersToFileStorageModuleFilesApi.find({
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
    "ecommerce-orders-to-file-storage-module-files-get-by-id",
    {
      title: "Get ecommerce orders-to-file-storage-module-files relation by id",
      description: "Get a orders-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: ecommerceOrdersToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceOrdersToFileStorageModuleFilesApi.findById({
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
    "ecommerce-orders-to-file-storage-module-files-post",
    {
      title: "Create ecommerce orders-to-file-storage-module-files relation",
      description:
        "Create a new orders-to-file-storage-module-files relation in the ecommerce module.",
      inputSchema: ecommerceOrdersToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await ecommerceOrdersToFileStorageModuleFilesApi.create({
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
    "ecommerce-orders-to-file-storage-module-files-patch",
    {
      title:
        "Update ecommerce orders-to-file-storage-module-files relation by id",
      description:
        "Update an existing orders-to-file-storage-module-files relation by id.",
      inputSchema: ecommerceOrdersToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceOrdersToFileStorageModuleFilesApi.update({
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
    "ecommerce-orders-to-file-storage-module-files-delete",
    {
      title:
        "Delete ecommerce orders-to-file-storage-module-files relation by id",
      description:
        "Delete an existing orders-to-file-storage-module-files relation by id.",
      inputSchema: ecommerceOrdersToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceOrdersToFileStorageModuleFilesApi.delete({
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
