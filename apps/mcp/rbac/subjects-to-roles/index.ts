import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { insertSchema as rbacSubjectsToRolesInsertSchema } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-roles",
    "sps://rbac/subjects-to-roles",
    {
      title: "rbac subjects-to-roles relation",
      description:
        "Get list of all subjects-to-roles relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToRolesApi.find({
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
    "rbac-subjects-to-roles-count",
    "Count rbac subjects to roles",
    "Count rbac subjects to roles entities with optional filters.",
    rbacSubjectsToRolesApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-roles-get",
    {
      title: "List of rbac subjects-to-roles relations",
      description:
        "Get list of all subjects-to-roles relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectsToRolesApi.find({
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
    "rbac-subjects-to-roles-get-by-id",
    {
      title: "Get rbac subjects-to-roles relation by id",
      description: "Get a subjects-to-roles relation by id.",
      inputSchema: {
        id: rbacSubjectsToRolesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToRolesApi.findById({
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
    "rbac-subjects-to-roles-post",
    {
      title: "Create rbac subjects-to-roles relation",
      description:
        "Create a new subjects-to-roles relation in the rbac module.",
      inputSchema: rbacSubjectsToRolesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectsToRolesApi.create({
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
    "rbac-subjects-to-roles-patch",
    {
      title: "Update rbac subjects-to-roles relation by id",
      description: "Update an existing subjects-to-roles relation by id.",
      inputSchema: rbacSubjectsToRolesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectsToRolesApi.update({
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
    "rbac-subjects-to-roles-delete",
    {
      title: "Delete rbac subjects-to-roles relation by id",
      description: "Delete an existing subjects-to-roles relation by id.",
      inputSchema: rbacSubjectsToRolesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectsToRolesApi.delete({
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
