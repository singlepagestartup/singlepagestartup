import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderButtonsToFileStorageModuleFilesApi } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderButtonsToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-buttons-to-file-storage-module-files",
    "sps://website-builder/buttons-to-file-storage-module-files",
    {
      title: "website-builder buttons-to-file-storage-module-files relation",
      description:
        "Get list of all buttons-to-file-storage-module-files relations from website-builder module",
    },
    async (uri) => {
      const resp =
        await websiteBuilderButtonsToFileStorageModuleFilesApi.find();

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
    "website-builder-buttons-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder buttons-to-file-storage-module-files relations",
      description:
        "Get list of all buttons-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.find({
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
    "website-builder-buttons-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder buttons-to-file-storage-module-files relation by id",
      description: "Get a buttons-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.findById({
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
    "website-builder-buttons-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder buttons-to-file-storage-module-files relation",
      description:
        "Create a new buttons-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.create({
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
    "website-builder-buttons-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder buttons-to-file-storage-module-files relation by id",
      description:
        "Update an existing buttons-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
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
          await websiteBuilderButtonsToFileStorageModuleFilesApi.update({
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
    "website-builder-buttons-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder buttons-to-file-storage-module-files relation by id",
      description:
        "Delete an existing buttons-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
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
          await websiteBuilderButtonsToFileStorageModuleFilesApi.delete({
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
