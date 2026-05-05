import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as broadcastMessageApi } from "@sps/broadcast/models/message/sdk/server";
import { insertSchema as broadcastMessageInsertSchema } from "@sps/broadcast/models/message/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "broadcast-module-messages",
    "sps://broadcast/messages",
    {
      title: "broadcast module messages",
      description: "Get list of all messages from broadcast module",
    },
    async (uri, extra) => {
      const resp = await broadcastMessageApi.find({
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
    "broadcast-module-message-count",
    "Count broadcast module message",
    "Count broadcast module message entities with optional filters.",
    broadcastMessageApi,
  );

  mcp.registerTool(
    "broadcast-module-message-get",
    {
      title: "List of broadcast module messages",
      description: "Get list of all messages from broadcast module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await broadcastMessageApi.find({
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
    "broadcast-module-message-get-by-id",
    {
      title: "Get broadcast module message by id",
      description: "Get a message from broadcast module by id.",
      inputSchema: {
        id: broadcastMessageInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await broadcastMessageApi.findById({
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
    "broadcast-module-message-post",
    {
      title: "Create broadcast module message",
      description: "Create a new message in the broadcast module.",
      inputSchema: broadcastMessageInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await broadcastMessageApi.create({
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
    "broadcast-module-message-patch",
    {
      title: "Update broadcast module message by id",
      description: "Update an existing message in the broadcast module by id.",
      inputSchema: broadcastMessageInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await broadcastMessageApi.update({
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
    "broadcast-module-message-delete",
    {
      title: "Delete broadcast module message by id",
      description: "Delete an existing message in the broadcast module by id.",
      inputSchema: broadcastMessageInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await broadcastMessageApi.delete({
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
