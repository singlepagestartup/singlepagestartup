import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToFileStorageModuleFilesApi } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server";
import { insertSchema as socialProfilesToFileStorageModuleFilesInsertSchema } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-file-storage-module-files",
    "sps://social/profiles-to-file-storage-module-files",
    {
      title: "social profiles-to-file-storage-module-files relation",
      description:
        "Get list of all profiles-to-file-storage-module-files relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToFileStorageModuleFilesApi.find({
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
    "social-profiles-to-file-storage-module-files-count",
    "Count social profiles to file storage module files",
    "Count social profiles to file storage module files entities with optional filters.",
    socialProfilesToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "social-profiles-to-file-storage-module-files-get",
    {
      title: "List of social profiles-to-file-storage-module-files relations",
      description:
        "Get list of all profiles-to-file-storage-module-files relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToFileStorageModuleFilesApi.find({
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
    "social-profiles-to-file-storage-module-files-get-by-id",
    {
      title: "Get social profiles-to-file-storage-module-files relation by id",
      description:
        "Get a profiles-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: socialProfilesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfilesToFileStorageModuleFilesApi.findById(
          {
            id: args.id,
          },
        );

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
    "social-profiles-to-file-storage-module-files-post",
    {
      title: "Create social profiles-to-file-storage-module-files relation",
      description:
        "Create a new profiles-to-file-storage-module-files relation in the social module.",
      inputSchema: socialProfilesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToFileStorageModuleFilesApi.create({
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
    "social-profiles-to-file-storage-module-files-patch",
    {
      title:
        "Update social profiles-to-file-storage-module-files relation by id",
      description:
        "Update an existing profiles-to-file-storage-module-files relation by id.",
      inputSchema: socialProfilesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToFileStorageModuleFilesApi.update({
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
    "social-profiles-to-file-storage-module-files-delete",
    {
      title:
        "Delete social profiles-to-file-storage-module-files relation by id",
      description:
        "Delete an existing profiles-to-file-storage-module-files relation by id.",
      inputSchema: socialProfilesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToFileStorageModuleFilesApi.delete({
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
