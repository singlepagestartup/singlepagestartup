import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmStepsToInputsApi } from "@sps/crm/relations/steps-to-inputs/sdk/server";
import { insertSchema as crmStepsToInputsInsertSchema } from "@sps/crm/relations/steps-to-inputs/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

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
  registerCountTool(
    mcp,
    "crm-steps-to-inputs-count",
    "Count crm steps to inputs",
    "Count crm steps to inputs entities with optional filters.",
    crmStepsToInputsApi,
  );

  mcp.registerTool(
    "crm-steps-to-inputs-get",
    {
      title: "List of crm steps-to-inputs relations",
      description: "Get list of all steps-to-inputs relations from crm module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await crmStepsToInputsApi.find({
          options: {
            headers: {},
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
        const entity = await crmStepsToInputsApi.create({
          data: args,
          options: {
            headers: {},
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

        const entity = await crmStepsToInputsApi.update({
          id: args.id,
          data: args,
          options: {
            headers: {},
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

        const entity = await crmStepsToInputsApi.delete({
          id: args.id,
          options: {
            headers: {},
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
