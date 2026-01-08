import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmOptionsToFileStorageModuleFilesApi } from "@sps/crm/relations/options-to-file-storage-module-files/sdk/server";
import { insertSchema as crmOptionsToFileStorageModuleFilesInsertSchema } from "@sps/crm/relations/options-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-relations-options-to-file-storage-module-files",
    "sps://crm/options-to-file-storage-module-files",
    {
      title: "crm options-to-file-storage-module-files relation",
      description:
        "Get list of all options-to-file-storage-module-files relations from crm module",
    },
    async (uri) => {
      const resp = await crmOptionsToFileStorageModuleFilesApi.find();

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
    "crm-options-to-file-storage-module-files-get",
    {
      title: "List of crm options-to-file-storage-module-files relations",
      description:
        "Get list of all options-to-file-storage-module-files relations from crm module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await crmOptionsToFileStorageModuleFilesApi.find({
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
    "crm-options-to-file-storage-module-files-get-by-id",
    {
      title: "Get crm options-to-file-storage-module-files relation by id",
      description: "Get a options-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: crmOptionsToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmOptionsToFileStorageModuleFilesApi.findById({
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
    "crm-options-to-file-storage-module-files-post",
    {
      title: "Create crm options-to-file-storage-module-files relation",
      description:
        "Create a new options-to-file-storage-module-files relation in the crm module.",
      inputSchema: crmOptionsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmOptionsToFileStorageModuleFilesApi.create({
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
    "crm-options-to-file-storage-module-files-patch",
    {
      title: "Update crm options-to-file-storage-module-files relation by id",
      description:
        "Update an existing options-to-file-storage-module-files relation by id.",
      inputSchema: crmOptionsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmOptionsToFileStorageModuleFilesApi.update({
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
    "crm-options-to-file-storage-module-files-delete",
    {
      title: "Delete crm options-to-file-storage-module-files relation by id",
      description:
        "Delete an existing options-to-file-storage-module-files relation by id.",
      inputSchema: crmOptionsToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmOptionsToFileStorageModuleFilesApi.delete({
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
