import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as hostModulePageApi } from "@sps/host/models/page/sdk/server";
import { insertSchema as hostModulePageInsertSchema } from "@sps/host/models/page/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "host-modules-pages",
    "sps://host/pages",
    {
      title: "host module pages",
      description: "Get list of all pages from host module",
    },
    async (uri) => {
      const resp = await hostModulePageApi.find();

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
    "host-module-page-get",
    {
      title: "List of host module pages",
      description: "Get list of all pages from host module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await hostModulePageApi.find({
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
              text: `${JSON.stringify(entities, null, 2)}`,
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
    "host-module-page-get-by-id",
    {
      title: "Get host module page by id",
      description: "Get a page from host module by id.",
      inputSchema: {
        id: hostModulePageInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await hostModulePageApi.findById({
          id: args.id,
        });

        return {
          content: [
            {
              type: "text",
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-module-page-post",
    {
      title: "Create host module page",
      description: "Create a new page in the host module.",
      inputSchema: hostModulePageInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostModulePageApi.create({
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
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-module-page-patch",
    {
      title: "Update host module page by id",
      description: "Update an existing page in the host module by id.",
      inputSchema: hostModulePageInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostModulePageApi.update({
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
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-module-page-delete",
    {
      title: "Delete host module page by id",
      description: "Delete an existing page in the host module by id.",
      inputSchema: hostModulePageInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostModulePageApi.delete({
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
              text: `${JSON.stringify(entity, null, 2)}`,
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
