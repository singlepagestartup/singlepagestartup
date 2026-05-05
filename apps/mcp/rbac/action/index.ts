import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { insertSchema as rbacActionInsertSchema } from "@sps/rbac/models/action/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-module-actions",
    "sps://rbac/actions",
    {
      title: "rbac module actions",
      description: "Get list of all actions from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacActionApi.find({
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
    "rbac-module-action-count",
    "Count rbac module action",
    "Count rbac module action entities with optional filters.",
    rbacActionApi,
  );

  mcp.registerTool(
    "rbac-module-action-get",
    {
      title: "List of rbac module actions",
      description: "Get list of all actions from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacActionApi.find({
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
    "rbac-module-action-get-by-id",
    {
      title: "Get rbac module action by id",
      description: "Get a action from rbac module by id.",
      inputSchema: {
        id: rbacActionInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacActionApi.findById({
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
    "rbac-module-action-post",
    {
      title: "Create rbac module action",
      description: "Create a new action in the rbac module.",
      inputSchema: rbacActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacActionApi.create({
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
    "rbac-module-action-patch",
    {
      title: "Update rbac module action by id",
      description: "Update an existing action in the rbac module by id.",
      inputSchema: rbacActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacActionApi.update({
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
    "rbac-module-action-delete",
    {
      title: "Delete rbac module action by id",
      description: "Delete an existing action in the rbac module by id.",
      inputSchema: rbacActionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacActionApi.delete({
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
