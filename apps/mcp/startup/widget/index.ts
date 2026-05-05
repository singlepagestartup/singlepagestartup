import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as startupWidgetApi } from "@sps/startup/models/widget/sdk/server";
import { insertSchema as startupWidgetInsertSchema } from "@sps/startup/models/widget/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "startup-module-widgets",
    "sps://startup/widgets",
    {
      title: "startup module widgets",
      description: "Get list of all widgets from startup module",
    },
    async (uri) => {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY is not set");
      }

      const resp = await startupWidgetApi.find({
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
    "startup-module-widget-count",
    "Count startup module widget",
    "Count startup module widget entities with optional filters.",
    startupWidgetApi,
  );

  mcp.registerTool(
    "startup-module-widget-get",
    {
      title: "List of startup module widgets",
      description: "Get list of all widgets from startup module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await startupWidgetApi.find({
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
    "startup-module-widget-get-by-id",
    {
      title: "Get startup module widget by id",
      description: "Get a widget from startup module by id.",
      inputSchema: {
        id: startupWidgetInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await startupWidgetApi.findById({
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
    "startup-module-widget-post",
    {
      title: "Create startup module widget",
      description: "Create a new widget in the startup module.",
      inputSchema: startupWidgetInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await startupWidgetApi.create({
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
    "startup-module-widget-patch",
    {
      title: "Update startup module widget by id",
      description: "Update an existing widget in the startup module by id.",
      inputSchema: startupWidgetInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await startupWidgetApi.update({
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
    "startup-module-widget-delete",
    {
      title: "Delete startup module widget by id",
      description: "Delete an existing widget in the startup module by id.",
      inputSchema: startupWidgetInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await startupWidgetApi.delete({
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
