import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacRolesToPermissionsApi } from "@sps/rbac/relations/roles-to-permissions/sdk/server";
import { insertSchema as rbacRolesToPermissionsInsertSchema } from "@sps/rbac/relations/roles-to-permissions/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-roles-to-permissions",
    "sps://rbac/roles-to-permissions",
    {
      title: "rbac roles-to-permissions relation",
      description:
        "Get list of all roles-to-permissions relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacRolesToPermissionsApi.find({
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
    "rbac-roles-to-permissions-count",
    "Count rbac roles to permissions",
    "Count rbac roles to permissions entities with optional filters.",
    rbacRolesToPermissionsApi,
  );

  mcp.registerTool(
    "rbac-roles-to-permissions-get",
    {
      title: "List of rbac roles-to-permissions relations",
      description:
        "Get list of all roles-to-permissions relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacRolesToPermissionsApi.find({
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
    "rbac-roles-to-permissions-get-by-id",
    {
      title: "Get rbac roles-to-permissions relation by id",
      description: "Get a roles-to-permissions relation by id.",
      inputSchema: {
        id: rbacRolesToPermissionsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacRolesToPermissionsApi.findById({
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
    "rbac-roles-to-permissions-post",
    {
      title: "Create rbac roles-to-permissions relation",
      description:
        "Create a new roles-to-permissions relation in the rbac module.",
      inputSchema: rbacRolesToPermissionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacRolesToPermissionsApi.create({
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
    "rbac-roles-to-permissions-patch",
    {
      title: "Update rbac roles-to-permissions relation by id",
      description: "Update an existing roles-to-permissions relation by id.",
      inputSchema: rbacRolesToPermissionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacRolesToPermissionsApi.update({
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
    "rbac-roles-to-permissions-delete",
    {
      title: "Delete rbac roles-to-permissions relation by id",
      description: "Delete an existing roles-to-permissions relation by id.",
      inputSchema: rbacRolesToPermissionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacRolesToPermissionsApi.delete({
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
