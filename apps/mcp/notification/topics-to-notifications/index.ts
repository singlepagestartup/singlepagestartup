import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { insertSchema as notificationTopicsToNotificationsInsertSchema } from "@sps/notification/relations/topics-to-notifications/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "notification-relations-topics-to-notifications",
    "sps://notification/topics-to-notifications",
    {
      title: "notification topics-to-notifications relation",
      description:
        "Get list of all topics-to-notifications relations from notification module",
    },
    async (uri) => {
      const resp = await notificationTopicsToNotificationsApi.find();

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
    "notification-topics-to-notifications-count",
    "Count notification topics to notifications",
    "Count notification topics to notifications entities with optional filters.",
    notificationTopicsToNotificationsApi,
  );

  mcp.registerTool(
    "notification-topics-to-notifications-get",
    {
      title: "List of notification topics-to-notifications relations",
      description:
        "Get list of all topics-to-notifications relations from notification module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await notificationTopicsToNotificationsApi.find({
          options: {
            headers: {},
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
    "notification-topics-to-notifications-get-by-id",
    {
      title: "Get notification topics-to-notifications relation by id",
      description: "Get a topics-to-notifications relation by id.",
      inputSchema: {
        id: notificationTopicsToNotificationsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await notificationTopicsToNotificationsApi.findById({
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
    "notification-topics-to-notifications-post",
    {
      title: "Create notification topics-to-notifications relation",
      description:
        "Create a new topics-to-notifications relation in the notification module.",
      inputSchema: notificationTopicsToNotificationsInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await notificationTopicsToNotificationsApi.create({
          data: args,
          options: {
            headers: {},
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
    "notification-topics-to-notifications-patch",
    {
      title: "Update notification topics-to-notifications relation by id",
      description: "Update an existing topics-to-notifications relation by id.",
      inputSchema: notificationTopicsToNotificationsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await notificationTopicsToNotificationsApi.update({
          id: args.id,
          data: args,
          options: {
            headers: {},
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
    "notification-topics-to-notifications-delete",
    {
      title: "Delete notification topics-to-notifications relation by id",
      description: "Delete an existing topics-to-notifications relation by id.",
      inputSchema: notificationTopicsToNotificationsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await notificationTopicsToNotificationsApi.delete({
          id: args.id,
          options: {
            headers: {},
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
