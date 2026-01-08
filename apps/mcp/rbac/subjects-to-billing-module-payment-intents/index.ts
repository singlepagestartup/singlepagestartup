import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToBillingModulePaymentIntentsApi } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/sdk/server";
import { insertSchema as rbacSubjectsToBillingModulePaymentIntentsInsertSchema } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-billing-module-payment-intents",
    "sps://rbac/subjects-to-billing-module-payment-intents",
    {
      title: "rbac subjects-to-billing-module-payment-intents relation",
      description:
        "Get list of all subjects-to-billing-module-payment-intents relations from rbac module",
    },
    async (uri) => {
      const resp = await rbacSubjectsToBillingModulePaymentIntentsApi.find();

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
  mcp.registerTool(
    "rbac-subjects-to-billing-module-payment-intents-get",
    {
      title:
        "List of rbac subjects-to-billing-module-payment-intents relations",
      description:
        "Get list of all subjects-to-billing-module-payment-intents relations from rbac module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities =
          await rbacSubjectsToBillingModulePaymentIntentsApi.find({
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.findById({
            id: args.id,
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
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.create({
            data: args,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.update({
            id: args.id,
            data: args,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity =
          await rbacSubjectsToBillingModulePaymentIntentsApi.delete({
            id: args.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
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
