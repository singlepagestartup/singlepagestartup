import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderSlidesToFileStorageModuleFilesApi } from "@sps/website-builder/relations/slides-to-file-storage-module-files/sdk/server";
import { insertSchema as websiteBuilderSlidesToFileStorageModuleFilesInsertSchema } from "@sps/website-builder/relations/slides-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-slides-to-file-storage-module-files",
    "sps://website-builder/slides-to-file-storage-module-files",
    {
      title: "website-builder slides-to-file-storage-module-files relation",
      description:
        "Get list of all slides-to-file-storage-module-files relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderSlidesToFileStorageModuleFilesApi.find({
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
    "website-builder-slides-to-file-storage-module-files-count",
    "Count website builder slides to file storage module files",
    "Count website builder slides to file storage module files entities with optional filters.",
    websiteBuilderSlidesToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "website-builder-slides-to-file-storage-module-files-get",
    {
      title:
        "List of website-builder slides-to-file-storage-module-files relations",
      description:
        "Get list of all slides-to-file-storage-module-files relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await websiteBuilderSlidesToFileStorageModuleFilesApi.find({
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
    "website-builder-slides-to-file-storage-module-files-get-by-id",
    {
      title:
        "Get website-builder slides-to-file-storage-module-files relation by id",
      description: "Get a slides-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: websiteBuilderSlidesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await websiteBuilderSlidesToFileStorageModuleFilesApi.findById({
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
    "website-builder-slides-to-file-storage-module-files-post",
    {
      title:
        "Create website-builder slides-to-file-storage-module-files relation",
      description:
        "Create a new slides-to-file-storage-module-files relation in the website-builder module.",
      inputSchema:
        websiteBuilderSlidesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await websiteBuilderSlidesToFileStorageModuleFilesApi.create({
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
    "website-builder-slides-to-file-storage-module-files-patch",
    {
      title:
        "Update website-builder slides-to-file-storage-module-files relation by id",
      description:
        "Update an existing slides-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderSlidesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await websiteBuilderSlidesToFileStorageModuleFilesApi.update({
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
    "website-builder-slides-to-file-storage-module-files-delete",
    {
      title:
        "Delete website-builder slides-to-file-storage-module-files relation by id",
      description:
        "Delete an existing slides-to-file-storage-module-files relation by id.",
      inputSchema:
        websiteBuilderSlidesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await websiteBuilderSlidesToFileStorageModuleFilesApi.delete({
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
