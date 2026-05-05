import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as fileStorageWidgetsToFilesApi } from "@sps/file-storage/relations/widgets-to-files/sdk/server";
import { insertSchema as fileStorageWidgetsToFilesInsertSchema } from "@sps/file-storage/relations/widgets-to-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "file-storage-relations-widgets-to-files",
    "sps://file-storage/widgets-to-files",
    {
      title: "file-storage widgets-to-files relation",
      description:
        "Get list of all widgets-to-files relations from file-storage module",
    },
    async (uri, extra) => {
      const resp = await fileStorageWidgetsToFilesApi.find({
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
    "file-storage-widgets-to-files-count",
    "Count file storage widgets to files",
    "Count file storage widgets to files entities with optional filters.",
    fileStorageWidgetsToFilesApi,
  );

  mcp.registerTool(
    "file-storage-widgets-to-files-get",
    {
      title: "List of file-storage widgets-to-files relations",
      description:
        "Get list of all widgets-to-files relations from file-storage module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await fileStorageWidgetsToFilesApi.find({
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
    "file-storage-widgets-to-files-get-by-id",
    {
      title: "Get file-storage widgets-to-files relation by id",
      description: "Get a widgets-to-files relation by id.",
      inputSchema: {
        id: fileStorageWidgetsToFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await fileStorageWidgetsToFilesApi.findById({
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
    "file-storage-widgets-to-files-post",
    {
      title: "Create file-storage widgets-to-files relation",
      description:
        "Create a new widgets-to-files relation in the file-storage module.",
      inputSchema: fileStorageWidgetsToFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await fileStorageWidgetsToFilesApi.create({
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
    "file-storage-widgets-to-files-patch",
    {
      title: "Update file-storage widgets-to-files relation by id",
      description: "Update an existing widgets-to-files relation by id.",
      inputSchema: fileStorageWidgetsToFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await fileStorageWidgetsToFilesApi.update({
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
    "file-storage-widgets-to-files-delete",
    {
      title: "Delete file-storage widgets-to-files relation by id",
      description: "Delete an existing widgets-to-files relation by id.",
      inputSchema: fileStorageWidgetsToFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await fileStorageWidgetsToFilesApi.delete({
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
