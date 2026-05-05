import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderWidgetsToFileStorageModuleFilesApi } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderWidgetsToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-widgets-to-file-storage-module-files",
    "sps://website-builder/widgets-to-file-storage-module-files",
    {
      title: "website-builder widgets-to-file-storage-module-files relation",
      description:
        "Get list of all widgets-to-file-storage-module-files relations from website-builder module",
    },
    async (uri, extra) => {
      const resp =
        await websiteBuilderWidgetsToFileStorageModuleFilesApi.find();

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
    "website-builder-widgets-to-file-storage-module-files-count",
    "Count website builder widgets to file storage module files",
    "Count website builder widgets to file storage module files entities with optional filters.",
    websiteBuilderWidgetsToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "website-builder-widgets-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder widgets-to-file-storage-module-files relations",
      description:
        "Get list of all widgets-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await websiteBuilderWidgetsToFileStorageModuleFilesApi.find({
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
    "website-builder-widgets-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder widgets-to-file-storage-module-files relation by id",
      description: "Get a widgets-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderWidgetsToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderWidgetsToFileStorageModuleFilesApi.findById({
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
    "website-builder-widgets-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder widgets-to-file-storage-module-files relation",
      description:
        "Create a new widgets-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderWidgetsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await websiteBuilderWidgetsToFileStorageModuleFilesApi.create({
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
    "website-builder-widgets-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder widgets-to-file-storage-module-files relation by id",
      description:
        "Update an existing widgets-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderWidgetsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await websiteBuilderWidgetsToFileStorageModuleFilesApi.update({
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
    "website-builder-widgets-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder widgets-to-file-storage-module-files relation by id",
      description:
        "Delete an existing widgets-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderWidgetsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await websiteBuilderWidgetsToFileStorageModuleFilesApi.delete({
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
