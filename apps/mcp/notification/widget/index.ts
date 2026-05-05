import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as notificationWidgetApi } from "@sps/notification/models/widget/sdk/server";
import { insertSchema as notificationWidgetInsertSchema } from "@sps/notification/models/widget/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "notification-module-widgets",
    "sps://notification/widgets",
    {
      title: "notification module widgets",
      description: "Get list of all widgets from notification module",
    },
    async (uri, extra) => {
      const resp = await notificationWidgetApi.find({
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
    "notification-module-widget-count",
    "Count notification module widget",
    "Count notification module widget entities with optional filters.",
    notificationWidgetApi,
  );

  mcp.registerTool(
    "notification-module-widget-get",
    {
      title: "List of notification module widgets",
      description: "Get list of all widgets from notification module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await notificationWidgetApi.find({
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
    "notification-module-widget-get-by-id",
    {
      title: "Get notification module widget by id",
      description: "Get a widget from notification module by id.",
      inputSchema: {
        id: notificationWidgetInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await notificationWidgetApi.findById({
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
    "notification-module-widget-post",
    {
      title: "Create notification module widget",
      description: "Create a new widget in the notification module.",
      inputSchema: notificationWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await notificationWidgetApi.create({
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
    "notification-module-widget-patch",
    {
      title: "Update notification module widget by id",
      description:
        "Update an existing widget in the notification module by id.",
      inputSchema: notificationWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await notificationWidgetApi.update({
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
    "notification-module-widget-delete",
    {
      title: "Delete notification module widget by id",
      description:
        "Delete an existing widget in the notification module by id.",
      inputSchema: notificationWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await notificationWidgetApi.delete({
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
