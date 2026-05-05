import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { insertSchema as fileStorageFileInsertSchema } from "@sps/file-storage/models/file/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "file-storage-module-files",
    "sps://file-storage/files",
    {
      title: "file-storage module files",
      description: "Get list of all files from file-storage module",
    },
    async (uri) => {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY is not set");
      }

      const resp = await fileStorageFileApi.find({
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
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
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await fileStorageFileApi.find({
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
    "file-storage-module-file-get-by-id",
    {
      title: "Get file-storage module file by id",
      description: "Get a file from file-storage module by id.",
      inputSchema: {
        id: fileStorageFileInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await fileStorageFileApi.findById({
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
    "file-storage-module-file-post",
    {
      title: "Create file-storage module file",
      description: "Create a new file in the file-storage module.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await fileStorageFileApi.create({
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
    "file-storage-module-file-patch",
    {
      title: "Update file-storage module file by id",
      description: "Update an existing file in the file-storage module by id.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await fileStorageFileApi.update({
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
    "file-storage-module-file-delete",
    {
      title: "Delete file-storage module file by id",
      description: "Delete an existing file in the file-storage module by id.",
      inputSchema: fileStorageFileInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await fileStorageFileApi.delete({
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
