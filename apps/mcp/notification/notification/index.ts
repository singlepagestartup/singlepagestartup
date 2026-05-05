import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { insertSchema as notificationNotificationInsertSchema } from "@sps/notification/models/notification/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "notification-module-notifications",
    "sps://notification/notifications",
    {
      title: "notification module notifications",
      description: "Get list of all notifications from notification module",
    },
    async (uri, extra) => {
      const resp = await notificationNotificationApi.find({
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
    "notification-module-notification-count",
    "Count notification module notification",
    "Count notification module notification entities with optional filters.",
    notificationNotificationApi,
  );

  mcp.registerTool(
    "notification-module-notification-get",
    {
      title: "List of notification module notifications",
      description: "Get list of all notifications from notification module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await notificationNotificationApi.find({
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
    "notification-module-notification-get-by-id",
    {
      title: "Get notification module notification by id",
      description: "Get a notification from notification module by id.",
      inputSchema: {
        id: notificationNotificationInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await notificationNotificationApi.findById({
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
    "notification-module-notification-post",
    {
      title: "Create notification module notification",
      description: "Create a new notification in the notification module.",
      inputSchema: notificationNotificationInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await notificationNotificationApi.create({
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
    "notification-module-notification-patch",
    {
      title: "Update notification module notification by id",
      description:
        "Update an existing notification in the notification module by id.",
      inputSchema: notificationNotificationInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await notificationNotificationApi.update({
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
    "notification-module-notification-delete",
    {
      title: "Delete notification module notification by id",
      description:
        "Delete an existing notification in the notification module by id.",
      inputSchema: notificationNotificationInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await notificationNotificationApi.delete({
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
