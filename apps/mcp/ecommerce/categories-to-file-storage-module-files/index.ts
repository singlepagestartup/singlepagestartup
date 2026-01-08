import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceCategoriesToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/sdk/server";
import { insertSchema as ecommerceCategoriesToFileStorageModuleFilesInsertSchema } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-categories-to-file-storage-module-files",
    "sps://ecommerce/categories-to-file-storage-module-files",
    {
      title: "ecommerce categories-to-file-storage-module-files relation",
      description:
        "Get list of all categories-to-file-storage-module-files relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceCategoriesToFileStorageModuleFilesApi.find();

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
    "ecommerce-categories-to-file-storage-module-files-get",
    {
      title:
        "List of ecommerce categories-to-file-storage-module-files relations",
      description:
        "Get list of all categories-to-file-storage-module-files relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await ecommerceCategoriesToFileStorageModuleFilesApi.find({
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
    "ecommerce-categories-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get ecommerce categories-to-file-storage-module-files relation by id",
      description:
        "Get a categories-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: ecommerceCategoriesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await ecommerceCategoriesToFileStorageModuleFilesApi.findById({
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
    "ecommerce-categories-to-file-storage-module-files-post",
    {
      title:
        "Create ecommerce categories-to-file-storage-module-files relation",
      description:
        "Create a new categories-to-file-storage-module-files relation in the ecommerce module.",
      inputSchema:
        ecommerceCategoriesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await ecommerceCategoriesToFileStorageModuleFilesApi.create({
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
    "ecommerce-categories-to-file-storage-module-files-patch",
    {
      title:
        "Update ecommerce categories-to-file-storage-module-files relation by id",
      description:
        "Update an existing categories-to-file-storage-module-files relation by id.",
      inputSchema:
        ecommerceCategoriesToFileStorageModuleFilesInsertSchema.shape,
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
          await ecommerceCategoriesToFileStorageModuleFilesApi.update({
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
    "ecommerce-categories-to-file-storage-module-files-delete",
    {
      title:
        "Delete ecommerce categories-to-file-storage-module-files relation by id",
      description:
        "Delete an existing categories-to-file-storage-module-files relation by id.",
      inputSchema:
        ecommerceCategoriesToFileStorageModuleFilesInsertSchema.shape,
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
          await ecommerceCategoriesToFileStorageModuleFilesApi.delete({
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
