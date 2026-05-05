import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToActionsApi } from "@sps/rbac/relations/subjects-to-actions/sdk/server";
import { insertSchema as rbacSubjectsToActionsInsertSchema } from "@sps/rbac/relations/subjects-to-actions/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-actions",
    "sps://rbac/subjects-to-actions",
    {
      title: "rbac subjects-to-actions relation",
      description:
        "Get list of all subjects-to-actions relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToActionsApi.find({
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
    "rbac-subjects-to-actions-count",
    "Count rbac subjects to actions",
    "Count rbac subjects to actions entities with optional filters.",
    rbacSubjectsToActionsApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-actions-get",
    {
      title: "List of rbac subjects-to-actions relations",
      description:
        "Get list of all subjects-to-actions relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectsToActionsApi.find({
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
    "rbac-subjects-to-actions-get-by-id",
    {
      title: "Get rbac subjects-to-actions relation by id",
      description: "Get a subjects-to-actions relation by id.",
      inputSchema: {
        id: rbacSubjectsToActionsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToActionsApi.findById({
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
    "rbac-subjects-to-actions-post",
    {
      title: "Create rbac subjects-to-actions relation",
      description:
        "Create a new subjects-to-actions relation in the rbac module.",
      inputSchema: rbacSubjectsToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectsToActionsApi.create({
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
    "rbac-subjects-to-actions-patch",
    {
      title: "Update rbac subjects-to-actions relation by id",
      description: "Update an existing subjects-to-actions relation by id.",
      inputSchema: rbacSubjectsToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectsToActionsApi.update({
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
    "rbac-subjects-to-actions-delete",
    {
      title: "Delete rbac subjects-to-actions relation by id",
      description: "Delete an existing subjects-to-actions relation by id.",
      inputSchema: rbacSubjectsToActionsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectsToActionsApi.delete({
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
