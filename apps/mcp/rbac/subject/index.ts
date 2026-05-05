import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { insertSchema as rbacSubjectInsertSchema } from "@sps/rbac/models/subject/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-module-subjects",
    "sps://rbac/subjects",
    {
      title: "rbac module subjects",
      description: "Get list of all subjects from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectApi.find({
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
    "rbac-module-subject-count",
    "Count rbac module subject",
    "Count rbac module subject entities with optional filters.",
    rbacSubjectApi,
  );

  mcp.registerTool(
    "rbac-module-subject-get",
    {
      title: "List of rbac module subjects",
      description: "Get list of all subjects from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectApi.find({
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
    "rbac-module-subject-get-by-id",
    {
      title: "Get rbac module subject by id",
      description: "Get a subject from rbac module by id.",
      inputSchema: {
        id: rbacSubjectInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectApi.findById({
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
    "rbac-module-subject-post",
    {
      title: "Create rbac module subject",
      description: "Create a new subject in the rbac module.",
      inputSchema: rbacSubjectInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectApi.create({
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
    "rbac-module-subject-patch",
    {
      title: "Update rbac module subject by id",
      description: "Update an existing subject in the rbac module by id.",
      inputSchema: rbacSubjectInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectApi.update({
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
    "rbac-module-subject-delete",
    {
      title: "Delete rbac module subject by id",
      description: "Delete an existing subject in the rbac module by id.",
      inputSchema: rbacSubjectInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectApi.delete({
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
