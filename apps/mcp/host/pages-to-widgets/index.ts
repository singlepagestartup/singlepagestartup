import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as hostPagesToWidgetsApi } from "@sps/host/relations/pages-to-widgets/sdk/server";
import { insertSchema as hostPagesToWidgetsInsertSchema } from "@sps/host/relations/pages-to-widgets/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "host-relations-pages-to-widgets",
    "sps://host/pages-to-widgets",
    {
      title: "host pages-to-widgets relation",
      description:
        "Get list of all pages-to-widgets relations from host module",
    },
    async (uri) => {
      const resp = await hostPagesToWidgetsApi.find();

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
    "host-pages-to-widgets-get",
    {
      title: "List of host pages-to-widgets relations",
      description:
        "Get list of all pages-to-widgets relations from host module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await hostPagesToWidgetsApi.find({
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
    "host-pages-to-widgets-get-by-id",
    {
      title: "Get host pages-to-widgets relation by id",
      description: "Get a pages-to-widgets relation by id.",
      inputSchema: {
        id: hostPagesToWidgetsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await hostPagesToWidgetsApi.findById({
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
    "host-pages-to-widgets-post",
    {
      title: "Create host pages-to-widgets relation",
      description: "Create a new pages-to-widgets relation in the host module.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostPagesToWidgetsApi.create({
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
    "host-pages-to-widgets-patch",
    {
      title: "Update host pages-to-widgets relation by id",
      description: "Update an existing pages-to-widgets relation by id.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostPagesToWidgetsApi.update({
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
    "host-pages-to-widgets-delete",
    {
      title: "Delete host pages-to-widgets relation by id",
      description: "Delete an existing pages-to-widgets relation by id.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostPagesToWidgetsApi.delete({
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
