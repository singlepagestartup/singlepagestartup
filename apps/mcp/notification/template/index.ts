import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { insertSchema as notificationTemplateInsertSchema } from "@sps/notification/models/template/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "notification-module-templates",
    "sps://notification/templates",
    {
      title: "notification module templates",
      description: "Get list of all templates from notification module",
    },
    async (uri) => {
      const resp = await notificationTemplateApi.find();

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
    "notification-module-template-count",
    "Count notification module template",
    "Count notification module template entities with optional filters.",
    notificationTemplateApi,
  );

  mcp.registerTool(
    "notification-module-template-get",
    {
      title: "List of notification module templates",
      description: "Get list of all templates from notification module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await notificationTemplateApi.find({
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
    "notification-module-template-get-by-id",
    {
      title: "Get notification module template by id",
      description: "Get a template from notification module by id.",
      inputSchema: {
        id: notificationTemplateInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await notificationTemplateApi.findById({
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
    "notification-module-template-post",
    {
      title: "Create notification module template",
      description: "Create a new template in the notification module.",
      inputSchema: notificationTemplateInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await notificationTemplateApi.create({
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
    "notification-module-template-patch",
    {
      title: "Update notification module template by id",
      description:
        "Update an existing template in the notification module by id.",
      inputSchema: notificationTemplateInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await notificationTemplateApi.update({
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
    "notification-module-template-delete",
    {
      title: "Delete notification module template by id",
      description:
        "Delete an existing template in the notification module by id.",
      inputSchema: notificationTemplateInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await notificationTemplateApi.delete({
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
