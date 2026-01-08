import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialMessagesToFileStorageModuleFilesApi } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/server";
import { insertSchema as socialMessagesToFileStorageModuleFilesInsertSchema } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-messages-to-file-storage-module-files",
    "sps://social/messages-to-file-storage-module-files",
    {
      title: "social messages-to-file-storage-module-files relation",
      description:
        "Get list of all messages-to-file-storage-module-files relations from social module",
    },
    async (uri) => {
      const resp = await socialMessagesToFileStorageModuleFilesApi.find();

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
    "social-messages-to-file-storage-module-files-get",
    {
      title: "List of social messages-to-file-storage-module-files relations",
      description:
        "Get list of all messages-to-file-storage-module-files relations from social module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await socialMessagesToFileStorageModuleFilesApi.find({
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
    "social-messages-to-file-storage-module-files-get-by-id",
    {
      title: "Get social messages-to-file-storage-module-files relation by id",
      description:
        "Get a messages-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: socialMessagesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialMessagesToFileStorageModuleFilesApi.findById(
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
    "social-messages-to-file-storage-module-files-post",
    {
      title: "Create social messages-to-file-storage-module-files relation",
      description:
        "Create a new messages-to-file-storage-module-files relation in the social module.",
      inputSchema: socialMessagesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialMessagesToFileStorageModuleFilesApi.create({
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
    "social-messages-to-file-storage-module-files-patch",
    {
      title:
        "Update social messages-to-file-storage-module-files relation by id",
      description:
        "Update an existing messages-to-file-storage-module-files relation by id.",
      inputSchema: socialMessagesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialMessagesToFileStorageModuleFilesApi.update({
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
    "social-messages-to-file-storage-module-files-delete",
    {
      title:
        "Delete social messages-to-file-storage-module-files relation by id",
      description:
        "Delete an existing messages-to-file-storage-module-files relation by id.",
      inputSchema: socialMessagesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await socialMessagesToFileStorageModuleFilesApi.delete({
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
