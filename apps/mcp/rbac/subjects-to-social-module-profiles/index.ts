import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { insertSchema as rbacSubjectsToSocialModuleProfilesInsertSchema } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-social-module-profiles",
    "sps://rbac/subjects-to-social-module-profiles",
    {
      title: "rbac subjects-to-social-module-profiles relation",
      description:
        "Get list of all subjects-to-social-module-profiles relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToSocialModuleProfilesApi.find({
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
    "rbac-subjects-to-social-module-profiles-count",
    "Count rbac subjects to social module profiles",
    "Count rbac subjects to social module profiles entities with optional filters.",
    rbacSubjectsToSocialModuleProfilesApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-social-module-profiles-get",
    {
      title: "List of rbac subjects-to-social-module-profiles relations",
      description:
        "Get list of all subjects-to-social-module-profiles relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectsToSocialModuleProfilesApi.find({
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
    "rbac-subjects-to-social-module-profiles-get-by-id",
    {
      title: "Get rbac subjects-to-social-module-profiles relation by id",
      description: "Get a subjects-to-social-module-profiles relation by id.",
      inputSchema: {
        id: rbacSubjectsToSocialModuleProfilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToSocialModuleProfilesApi.findById({
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
    "rbac-subjects-to-social-module-profiles-post",
    {
      title: "Create rbac subjects-to-social-module-profiles relation",
      description:
        "Create a new subjects-to-social-module-profiles relation in the rbac module.",
      inputSchema: rbacSubjectsToSocialModuleProfilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectsToSocialModuleProfilesApi.create({
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
    "rbac-subjects-to-social-module-profiles-patch",
    {
      title: "Update rbac subjects-to-social-module-profiles relation by id",
      description:
        "Update an existing subjects-to-social-module-profiles relation by id.",
      inputSchema: rbacSubjectsToSocialModuleProfilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectsToSocialModuleProfilesApi.update({
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
    "rbac-subjects-to-social-module-profiles-delete",
    {
      title: "Delete rbac subjects-to-social-module-profiles relation by id",
      description:
        "Delete an existing subjects-to-social-module-profiles relation by id.",
      inputSchema: rbacSubjectsToSocialModuleProfilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectsToSocialModuleProfilesApi.delete({
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
