import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToNotificationModuleTopicsApi } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/server";
import { insertSchema as rbacSubjectsToNotificationModuleTopicsInsertSchema } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-notification-module-topics",
    "sps://rbac/subjects-to-notification-module-topics",
    {
      title: "rbac subjects-to-notification-module-topics relation",
      description:
        "Get list of all subjects-to-notification-module-topics relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToNotificationModuleTopicsApi.find({
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
    "rbac-subjects-to-notification-module-topics-count",
    "Count rbac subjects to notification module topics",
    "Count rbac subjects to notification module topics entities with optional filters.",
    rbacSubjectsToNotificationModuleTopicsApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-notification-module-topics-get",
    {
      title: "List of rbac subjects-to-notification-module-topics relations",
      description:
        "Get list of all subjects-to-notification-module-topics relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await rbacSubjectsToNotificationModuleTopicsApi.find({
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
    "rbac-subjects-to-notification-module-topics-get-by-id",
    {
      title: "Get rbac subjects-to-notification-module-topics relation by id",
      description:
        "Get a subjects-to-notification-module-topics relation by id.",
      inputSchema: {
        id: rbacSubjectsToNotificationModuleTopicsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToNotificationModuleTopicsApi.findById(
          {
            id: args.id,
          },
        );

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
    "rbac-subjects-to-notification-module-topics-post",
    {
      title: "Create rbac subjects-to-notification-module-topics relation",
      description:
        "Create a new subjects-to-notification-module-topics relation in the rbac module.",
      inputSchema: rbacSubjectsToNotificationModuleTopicsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await rbacSubjectsToNotificationModuleTopicsApi.create({
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
    "rbac-subjects-to-notification-module-topics-patch",
    {
      title:
        "Update rbac subjects-to-notification-module-topics relation by id",
      description:
        "Update an existing subjects-to-notification-module-topics relation by id.",
      inputSchema: rbacSubjectsToNotificationModuleTopicsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await rbacSubjectsToNotificationModuleTopicsApi.update({
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
    "rbac-subjects-to-notification-module-topics-delete",
    {
      title:
        "Delete rbac subjects-to-notification-module-topics relation by id",
      description:
        "Delete an existing subjects-to-notification-module-topics relation by id.",
      inputSchema: rbacSubjectsToNotificationModuleTopicsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await rbacSubjectsToNotificationModuleTopicsApi.delete({
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
