import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderButtonsToFileStorageModuleFilesApi } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderButtonsToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-buttons-to-file-storage-module-files",
    "sps://website-builder/buttons-to-file-storage-module-files",
    {
      title: "website-builder buttons-to-file-storage-module-files relation",
      description:
        "Get list of all buttons-to-file-storage-module-files relations from website-builder module",
    },
    async (uri, extra) => {
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
  registerCountTool(
    mcp,
    "website-builder-buttons-to-file-storage-module-files-count",
    "Count website builder buttons to file storage module files",
    "Count website builder buttons to file storage module files entities with optional filters.",
    websiteBuilderButtonsToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "website-builder-buttons-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder buttons-to-file-storage-module-files relations",
      description:
        "Get list of all buttons-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.find({
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
    "website-builder-buttons-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder buttons-to-file-storage-module-files relation by id",
      description: "Get a buttons-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.findById({
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
    "website-builder-buttons-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder buttons-to-file-storage-module-files relation",
      description:
        "Create a new buttons-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.create({
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
    "website-builder-buttons-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder buttons-to-file-storage-module-files relation by id",
      description:
        "Update an existing buttons-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.update({
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
    "website-builder-buttons-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder buttons-to-file-storage-module-files relation by id",
      description:
        "Delete an existing buttons-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderButtonsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await websiteBuilderButtonsToFileStorageModuleFilesApi.delete({
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
