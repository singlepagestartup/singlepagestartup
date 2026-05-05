import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToBillingModulePaymentIntentsApi } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/sdk/server";
import { insertSchema as rbacSubjectsToBillingModulePaymentIntentsInsertSchema } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-billing-module-payment-intents",
    "sps://rbac/subjects-to-billing-module-payment-intents",
    {
      title: "rbac subjects-to-billing-module-payment-intents relation",
      description:
        "Get list of all subjects-to-billing-module-payment-intents relations from rbac module",
    },
    async (uri, extra) => {
      const resp = await rbacSubjectsToBillingModulePaymentIntentsApi.find({
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
    "rbac-subjects-to-billing-module-payment-intents-count",
    "Count rbac subjects to billing module payment intents",
    "Count rbac subjects to billing module payment intents entities with optional filters.",
    rbacSubjectsToBillingModulePaymentIntentsApi,
  );

  mcp.registerTool(
    "rbac-subjects-to-billing-module-payment-intents-get",
    {
      title:
        "List of rbac subjects-to-billing-module-payment-intents relations",
      description:
        "Get list of all subjects-to-billing-module-payment-intents relations from rbac module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await rbacSubjectsToBillingModulePaymentIntentsApi.find({
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
    "rbac-subjects-to-billing-module-payment-intents-get-by-id",
    {
      title:
        "Get rbac subjects-to-billing-module-payment-intents relation by id",
      description:
        "Get a subjects-to-billing-module-payment-intents relation by id.",
      inputSchema: {
        id: rbacSubjectsToBillingModulePaymentIntentsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.findById({
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
    "rbac-subjects-to-billing-module-payment-intents-post",
    {
      title: "Create rbac subjects-to-billing-module-payment-intents relation",
      description:
        "Create a new subjects-to-billing-module-payment-intents relation in the rbac module.",
      inputSchema: rbacSubjectsToBillingModulePaymentIntentsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.create({
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
    "rbac-subjects-to-billing-module-payment-intents-patch",
    {
      title:
        "Update rbac subjects-to-billing-module-payment-intents relation by id",
      description:
        "Update an existing subjects-to-billing-module-payment-intents relation by id.",
      inputSchema: rbacSubjectsToBillingModulePaymentIntentsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.update({
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
    "rbac-subjects-to-billing-module-payment-intents-delete",
    {
      title:
        "Delete rbac subjects-to-billing-module-payment-intents relation by id",
      description:
        "Delete an existing subjects-to-billing-module-payment-intents relation by id.",
      inputSchema: rbacSubjectsToBillingModulePaymentIntentsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.delete({
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
