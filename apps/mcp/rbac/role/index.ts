import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacRoleApi } from "@sps/rbac/models/role/sdk/server";
import { insertSchema as rbacRoleInsertSchema } from "@sps/rbac/models/role/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-module-roles",
    "sps://rbac/roles",
    {
      title: "rbac module roles",
      description: "Get list of all roles from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacRoleApi.find({
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
    "rbac-module-role-count",
    "Count rbac module role",
    "Count rbac module role entities with optional filters.",
    rbacRoleApi,
  );

  mcp.registerTool(
    "rbac-module-role-get",
    {
      title: "List of rbac module roles",
      description: "Get list of all roles from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacRoleApi.find({
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
    "rbac-module-role-get-by-id",
    {
      title: "Get rbac module role by id",
      description: "Get a role from rbac module by id.",
      inputSchema: {
        id: rbacRoleInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacRoleApi.findById({
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
    "rbac-module-role-post",
    {
      title: "Create rbac module role",
      description: "Create a new role in the rbac module.",
      inputSchema: rbacRoleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacRoleApi.create({
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
    "rbac-module-role-patch",
    {
      title: "Update rbac module role by id",
      description: "Update an existing role in the rbac module by id.",
      inputSchema: rbacRoleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacRoleApi.update({
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
    "rbac-module-role-delete",
    {
      title: "Delete rbac module role by id",
      description: "Delete an existing role in the rbac module by id.",
      inputSchema: rbacRoleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacRoleApi.delete({
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
