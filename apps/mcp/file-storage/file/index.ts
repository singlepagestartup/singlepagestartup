import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { insertSchema as fileStorageFileInsertSchema } from "@sps/file-storage/models/file/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "file-storage-module-files",
    "sps://file-storage/files",
    {
      title: "file-storage module files",
      description: "Get list of all files from file-storage module",
    },
    async (uri, extra) => {
      const resp = await fileStorageFileApi.find({
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
    "file-storage-module-file-count",
    "Count file storage module file",
    "Count file storage module file entities with optional filters.",
    fileStorageFileApi,
  );

  mcp.registerTool(
    "file-storage-module-file-get",
    {
      title: "List of file-storage module files",
      description: "Get list of all files from file-storage module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await fileStorageFileApi.find({
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
    "file-storage-module-file-get-by-id",
    {
      title: "Get file-storage module file by id",
      description: "Get a file from file-storage module by id.",
      inputSchema: {
        id: fileStorageFileInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await fileStorageFileApi.findById({
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
    "file-storage-module-file-post",
    {
      title: "Create file-storage module file",
      description: "Create a new file in the file-storage module.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await fileStorageFileApi.create({
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
    "file-storage-module-file-patch",
    {
      title: "Update file-storage module file by id",
      description: "Update an existing file in the file-storage module by id.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await fileStorageFileApi.update({
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
    "file-storage-module-file-delete",
    {
      title: "Delete file-storage module file by id",
      description: "Delete an existing file in the file-storage module by id.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await fileStorageFileApi.delete({
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
