import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as telegramPagesToWidgetsApi } from "@sps/telegram/relations/pages-to-widgets/sdk/server";
import { insertSchema as telegramPagesToWidgetsInsertSchema } from "@sps/telegram/relations/pages-to-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "telegram-relations-pages-to-widgets",
    "sps://telegram/pages-to-widgets",
    {
      title: "telegram pages-to-widgets relation",
      description:
        "Get list of all pages-to-widgets relations from telegram module",
    },
    async (uri, extra) => {
      const resp = await telegramPagesToWidgetsApi.find({
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
    "telegram-pages-to-widgets-count",
    "Count telegram pages to widgets",
    "Count telegram pages to widgets entities with optional filters.",
    telegramPagesToWidgetsApi,
  );

  mcp.registerTool(
    "telegram-pages-to-widgets-get",
    {
      title: "List of telegram pages-to-widgets relations",
      description:
        "Get list of all pages-to-widgets relations from telegram module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await telegramPagesToWidgetsApi.find({
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
    "telegram-pages-to-widgets-get-by-id",
    {
      title: "Get telegram pages-to-widgets relation by id",
      description: "Get a pages-to-widgets relation by id.",
      inputSchema: {
        id: telegramPagesToWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await telegramPagesToWidgetsApi.findById({
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
    "telegram-pages-to-widgets-post",
    {
      title: "Create telegram pages-to-widgets relation",
      description:
        "Create a new pages-to-widgets relation in the telegram module.",
      inputSchema: telegramPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await telegramPagesToWidgetsApi.create({
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
    "telegram-pages-to-widgets-patch",
    {
      title: "Update telegram pages-to-widgets relation by id",
      description: "Update an existing pages-to-widgets relation by id.",
      inputSchema: telegramPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await telegramPagesToWidgetsApi.update({
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
    "telegram-pages-to-widgets-delete",
    {
      title: "Delete telegram pages-to-widgets relation by id",
      description: "Delete an existing pages-to-widgets relation by id.",
      inputSchema: telegramPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await telegramPagesToWidgetsApi.delete({
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
