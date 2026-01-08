import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmStepsToInputsApi } from "@sps/crm/relations/steps-to-inputs/sdk/server";
import { insertSchema as crmStepsToInputsInsertSchema } from "@sps/crm/relations/steps-to-inputs/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-relations-steps-to-inputs",
    "sps://crm/steps-to-inputs",
    {
      title: "crm steps-to-inputs relation",
      description: "Get list of all steps-to-inputs relations from crm module",
    },
    async (uri) => {
      const resp = await crmStepsToInputsApi.find();

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
    "crm-steps-to-inputs-get",
    {
      title: "List of crm steps-to-inputs relations",
      description: "Get list of all steps-to-inputs relations from crm module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await crmStepsToInputsApi.find({
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
    "crm-steps-to-inputs-get-by-id",
    {
      title: "Get crm steps-to-inputs relation by id",
      description: "Get a steps-to-inputs relation by id.",
      inputSchema: {
        id: crmStepsToInputsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmStepsToInputsApi.findById({
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
    "crm-steps-to-inputs-post",
    {
      title: "Create crm steps-to-inputs relation",
      description: "Create a new steps-to-inputs relation in the crm module.",
      inputSchema: crmStepsToInputsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmStepsToInputsApi.create({
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
    "crm-steps-to-inputs-patch",
    {
      title: "Update crm steps-to-inputs relation by id",
      description: "Update an existing steps-to-inputs relation by id.",
      inputSchema: crmStepsToInputsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmStepsToInputsApi.update({
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
    "crm-steps-to-inputs-delete",
    {
      title: "Delete crm steps-to-inputs relation by id",
      description: "Delete an existing steps-to-inputs relation by id.",
      inputSchema: crmStepsToInputsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await crmStepsToInputsApi.delete({
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
