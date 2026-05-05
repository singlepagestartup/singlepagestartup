import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacPermissionApi } from "@sps/rbac/models/permission/sdk/server";
import { insertSchema as rbacPermissionInsertSchema } from "@sps/rbac/models/permission/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-module-permissions",
    "sps://rbac/permissions",
    {
      title: "rbac module permissions",
      description: "Get list of all permissions from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacPermissionApi.find({
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
    "rbac-module-permission-count",
    "Count rbac module permission",
    "Count rbac module permission entities with optional filters.",
    rbacPermissionApi,
  );

  mcp.registerTool(
    "rbac-module-permission-get",
    {
      title: "List of rbac module permissions",
      description: "Get list of all permissions from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacPermissionApi.find({
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
    "rbac-module-permission-get-by-id",
    {
      title: "Get rbac module permission by id",
      description: "Get a permission from rbac module by id.",
      inputSchema: {
        id: rbacPermissionInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacPermissionApi.findById({
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
    "rbac-module-permission-post",
    {
      title: "Create rbac module permission",
      description: "Create a new permission in the rbac module.",
      inputSchema: rbacPermissionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacPermissionApi.create({
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
    "rbac-module-permission-patch",
    {
      title: "Update rbac module permission by id",
      description: "Update an existing permission in the rbac module by id.",
      inputSchema: rbacPermissionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacPermissionApi.update({
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
    "rbac-module-permission-delete",
    {
      title: "Delete rbac module permission by id",
      description: "Delete an existing permission in the rbac module by id.",
      inputSchema: rbacPermissionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacPermissionApi.delete({
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
