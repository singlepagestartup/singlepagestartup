import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderLogotypesToFileStorageModuleFilesApi } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderLogotypesToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-logotypes-to-file-storage-module-files",
    "sps://website-builder/logotypes-to-file-storage-module-files",
    {
      title: "website-builder logotypes-to-file-storage-module-files relation",
      description:
        "Get list of all logotypes-to-file-storage-module-files relations from website-builder module",
    },
    async (uri, extra) => {
      const resp =
        await websiteBuilderLogotypesToFileStorageModuleFilesApi.find();

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
    "website-builder-logotypes-to-file-storage-module-files-count",
    "Count website builder logotypes to file storage module files",
    "Count website builder logotypes to file storage module files entities with optional filters.",
    websiteBuilderLogotypesToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "website-builder-logotypes-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder logotypes-to-file-storage-module-files relations",
      description:
        "Get list of all logotypes-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await websiteBuilderLogotypesToFileStorageModuleFilesApi.find({
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
    "website-builder-logotypes-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder logotypes-to-file-storage-module-files relation by id",
      description:
        "Get a logotypes-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderLogotypesToFileStorageModuleFilesInsertSchema.shape
          .id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderLogotypesToFileStorageModuleFilesApi.findById({
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
    "website-builder-logotypes-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder logotypes-to-file-storage-module-files relation",
      description:
        "Create a new logotypes-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderLogotypesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await websiteBuilderLogotypesToFileStorageModuleFilesApi.create({
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
    "website-builder-logotypes-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder logotypes-to-file-storage-module-files relation by id",
      description:
        "Update an existing logotypes-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderLogotypesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await websiteBuilderLogotypesToFileStorageModuleFilesApi.update({
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
    "website-builder-logotypes-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder logotypes-to-file-storage-module-files relation by id",
      description:
        "Delete an existing logotypes-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderLogotypesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await websiteBuilderLogotypesToFileStorageModuleFilesApi.delete({
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
