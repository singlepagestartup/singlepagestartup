import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as hostWidgetsToExternalWidgetsApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";
import { insertSchema as hostWidgetsToExternalWidgetsInsertSchema } from "@sps/host/relations/widgets-to-external-widgets/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "host-relations-widgets-to-external-widgets",
    "sps://host/widgets-to-external-widgets",
    {
      title: "host widgets-to-external-widgets relation",
      description:
        "Get list of all widgets-to-external-widgets relations from host module",
    },
    async (uri) => {
      const resp = await hostWidgetsToExternalWidgetsApi.find();

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
    "host-widgets-to-external-widgets-get",
    {
      title: "List of host widgets-to-external-widgets relations",
      description:
        "Get list of all widgets-to-external-widgets relations from host module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await hostWidgetsToExternalWidgetsApi.find({
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
    "host-widgets-to-external-widgets-get-by-id",
    {
      title: "Get host widgets-to-external-widgets relation by id",
      description: "Get a widgets-to-external-widgets relation by id.",
      inputSchema: {
        id: hostWidgetsToExternalWidgetsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await hostWidgetsToExternalWidgetsApi.findById({
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
    "host-widgets-to-external-widgets-post",
    {
      title: "Create host widgets-to-external-widgets relation",
      description:
        "Create a new widgets-to-external-widgets relation in the host module.",
      inputSchema: hostWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostWidgetsToExternalWidgetsApi.create({
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
    "host-widgets-to-external-widgets-patch",
    {
      title: "Update host widgets-to-external-widgets relation by id",
      description:
        "Update an existing widgets-to-external-widgets relation by id.",
      inputSchema: hostWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostWidgetsToExternalWidgetsApi.update({
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
    "host-widgets-to-external-widgets-delete",
    {
      title: "Delete host widgets-to-external-widgets relation by id",
      description:
        "Delete an existing widgets-to-external-widgets relation by id.",
      inputSchema: hostWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await hostWidgetsToExternalWidgetsApi.delete({
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
