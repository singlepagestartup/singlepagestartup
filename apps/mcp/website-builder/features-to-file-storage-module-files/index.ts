import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderFeaturesToFileStorageModuleFilesApi } from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderFeaturesToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-features-to-file-storage-module-files",
    "sps://website-builder/features-to-file-storage-module-files",
    {
      title: "website-builder features-to-file-storage-module-files relation",
      description:
        "Get list of all features-to-file-storage-module-files relations from website-builder module",
    },
    async (uri, extra) => {
      const resp =
        await websiteBuilderFeaturesToFileStorageModuleFilesApi.find();

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
    "website-builder-features-to-file-storage-module-files-count",
    "Count website builder features to file storage module files",
    "Count website builder features to file storage module files entities with optional filters.",
    websiteBuilderFeaturesToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "website-builder-features-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder features-to-file-storage-module-files relations",
      description:
        "Get list of all features-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await websiteBuilderFeaturesToFileStorageModuleFilesApi.find({
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
    "website-builder-features-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder features-to-file-storage-module-files relation by id",
      description:
        "Get a features-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderFeaturesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderFeaturesToFileStorageModuleFilesApi.findById({
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
    "website-builder-features-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder features-to-file-storage-module-files relation",
      description:
        "Create a new features-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderFeaturesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await websiteBuilderFeaturesToFileStorageModuleFilesApi.create({
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
    "website-builder-features-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder features-to-file-storage-module-files relation by id",
      description:
        "Update an existing features-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderFeaturesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await websiteBuilderFeaturesToFileStorageModuleFilesApi.update({
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
    "website-builder-features-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder features-to-file-storage-module-files relation by id",
      description:
        "Delete an existing features-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderFeaturesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await websiteBuilderFeaturesToFileStorageModuleFilesApi.delete({
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
