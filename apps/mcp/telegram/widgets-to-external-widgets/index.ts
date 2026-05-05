import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as telegramWidgetsToExternalWidgetsApi } from "@sps/telegram/relations/widgets-to-external-widgets/sdk/server";
import { insertSchema as telegramWidgetsToExternalWidgetsInsertSchema } from "@sps/telegram/relations/widgets-to-external-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "telegram-relations-widgets-to-external-widgets",
    "sps://telegram/widgets-to-external-widgets",
    {
      title: "telegram widgets-to-external-widgets relation",
      description:
        "Get list of all widgets-to-external-widgets relations from telegram module",
    },
    async (uri, extra) => {
      const resp = await telegramWidgetsToExternalWidgetsApi.find({
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
    "telegram-widgets-to-external-widgets-count",
    "Count telegram widgets to external widgets",
    "Count telegram widgets to external widgets entities with optional filters.",
    telegramWidgetsToExternalWidgetsApi,
  );

  mcp.registerTool(
    "telegram-widgets-to-external-widgets-get",
    {
      title: "List of telegram widgets-to-external-widgets relations",
      description:
        "Get list of all widgets-to-external-widgets relations from telegram module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await telegramWidgetsToExternalWidgetsApi.find({
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
    "telegram-widgets-to-external-widgets-get-by-id",
    {
      title: "Get telegram widgets-to-external-widgets relation by id",
      description: "Get a widgets-to-external-widgets relation by id.",
      inputSchema: {
        id: telegramWidgetsToExternalWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await telegramWidgetsToExternalWidgetsApi.findById({
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
    "telegram-widgets-to-external-widgets-post",
    {
      title: "Create telegram widgets-to-external-widgets relation",
      description:
        "Create a new widgets-to-external-widgets relation in the telegram module.",
      inputSchema: telegramWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await telegramWidgetsToExternalWidgetsApi.create({
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
    "telegram-widgets-to-external-widgets-patch",
    {
      title: "Update telegram widgets-to-external-widgets relation by id",
      description:
        "Update an existing widgets-to-external-widgets relation by id.",
      inputSchema: telegramWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await telegramWidgetsToExternalWidgetsApi.update({
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
    "telegram-widgets-to-external-widgets-delete",
    {
      title: "Delete telegram widgets-to-external-widgets relation by id",
      description:
        "Delete an existing widgets-to-external-widgets relation by id.",
      inputSchema: telegramWidgetsToExternalWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await telegramWidgetsToExternalWidgetsApi.delete({
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
