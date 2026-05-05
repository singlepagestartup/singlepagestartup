import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { insertSchema as notificationNotificationsToTemplatesInsertSchema } from "@sps/notification/relations/notifications-to-templates/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "notification-relations-notifications-to-templates",
    "sps://notification/notifications-to-templates",
    {
      title: "notification notifications-to-templates relation",
      description:
        "Get list of all notifications-to-templates relations from notification module",
    },
    async (uri, extra) => {
      const resp = await notificationNotificationsToTemplatesApi.find({
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
    "notification-notifications-to-templates-count",
    "Count notification notifications to templates",
    "Count notification notifications to templates entities with optional filters.",
    notificationNotificationsToTemplatesApi,
  );

  mcp.registerTool(
    "notification-notifications-to-templates-get",
    {
      title: "List of notification notifications-to-templates relations",
      description:
        "Get list of all notifications-to-templates relations from notification module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await notificationNotificationsToTemplatesApi.find({
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
    "notification-notifications-to-templates-get-by-id",
    {
      title: "Get notification notifications-to-templates relation by id",
      description: "Get a notifications-to-templates relation by id.",
      inputSchema: {
        id: notificationNotificationsToTemplatesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await notificationNotificationsToTemplatesApi.findById({
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
    "notification-notifications-to-templates-post",
    {
      title: "Create notification notifications-to-templates relation",
      description:
        "Create a new notifications-to-templates relation in the notification module.",
      inputSchema: notificationNotificationsToTemplatesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await notificationNotificationsToTemplatesApi.create({
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
    "notification-notifications-to-templates-patch",
    {
      title: "Update notification notifications-to-templates relation by id",
      description:
        "Update an existing notifications-to-templates relation by id.",
      inputSchema: notificationNotificationsToTemplatesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await notificationNotificationsToTemplatesApi.update({
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
    "notification-notifications-to-templates-delete",
    {
      title: "Delete notification notifications-to-templates relation by id",
      description:
        "Delete an existing notifications-to-templates relation by id.",
      inputSchema: notificationNotificationsToTemplatesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await notificationNotificationsToTemplatesApi.delete({
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
