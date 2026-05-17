import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialMessageApi } from "@sps/social/models/message/sdk/server";
import { insertSchema as socialMessageInsertSchema } from "@sps/social/models/message/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-messages",
    "sps://social/messages",
    {
      title: "social module messages",
      description: "Get list of all messages from social module",
    },
    async (uri) => {
      const resp = await socialMessageApi.find();

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
    "social-module-message-count",
    "Count social module message",
    "Count social module message entities with optional filters.",
    socialMessageApi,
  );

  mcp.registerTool(
    "social-module-message-get",
    {
      title: "List of social module messages",
      description: "Get list of all messages from social module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await socialMessageApi.find({
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
    "social-module-message-get-by-id",
    {
      title: "Get social module message by id",
      description: "Get a message from social module by id.",
      inputSchema: {
        id: socialMessageInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialMessageApi.findById({
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
    "social-module-message-post",
    {
      title: "Create social module message",
      description: "Create a new message in the social module.",
      inputSchema: socialMessageInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await socialMessageApi.create({
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
    "social-module-message-patch",
    {
      title: "Update social module message by id",
      description: "Update an existing message in the social module by id.",
      inputSchema: socialMessageInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialMessageApi.update({
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
    "social-module-message-delete",
    {
      title: "Delete social module message by id",
      description: "Delete an existing message in the social module by id.",
      inputSchema: socialMessageInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialMessageApi.delete({
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
