import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceProductsToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { insertSchema as ecommerceProductsToFileStorageModuleFilesInsertSchema } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-products-to-file-storage-module-files",
    "sps://ecommerce/products-to-file-storage-module-files",
    {
      title: "ecommerce products-to-file-storage-module-files relation",
      description:
        "Get list of all products-to-file-storage-module-files relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceProductsToFileStorageModuleFilesApi.find();

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
    "ecommerce-products-to-file-storage-module-files-get",
    {
      title:
        "List of ecommerce products-to-file-storage-module-files relations",
      description:
        "Get list of all products-to-file-storage-module-files relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await ecommerceProductsToFileStorageModuleFilesApi.find({
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
    "ecommerce-products-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get ecommerce products-to-file-storage-module-files relation by id",
      description:
        "Get a products-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: ecommerceProductsToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceProductsToFileStorageModuleFilesApi.findById({
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
    "ecommerce-products-to-file-storage-module-files-post",
    {
      title: "Create ecommerce products-to-file-storage-module-files relation",
      description:
        "Create a new products-to-file-storage-module-files relation in the ecommerce module.",
      inputSchema: ecommerceProductsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await ecommerceProductsToFileStorageModuleFilesApi.create({
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
    "ecommerce-products-to-file-storage-module-files-patch",
    {
      title:
        "Update ecommerce products-to-file-storage-module-files relation by id",
      description:
        "Update an existing products-to-file-storage-module-files relation by id.",
      inputSchema: ecommerceProductsToFileStorageModuleFilesInsertSchema.shape,
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
          await ecommerceProductsToFileStorageModuleFilesApi.update({
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
    "ecommerce-products-to-file-storage-module-files-delete",
    {
      title:
        "Delete ecommerce products-to-file-storage-module-files relation by id",
      description:
        "Delete an existing products-to-file-storage-module-files relation by id.",
      inputSchema: ecommerceProductsToFileStorageModuleFilesInsertSchema.shape,
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
          await ecommerceProductsToFileStorageModuleFilesApi.delete({
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
