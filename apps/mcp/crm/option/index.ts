import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmOptionApi } from "@sps/crm/models/option/sdk/server";
import { insertSchema as crmOptionInsertSchema } from "@sps/crm/models/option/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-module-options",
    "sps://crm/options",
    {
      title: "crm module options",
      description: "Get list of all options from crm module",
    },
    async (uri, extra) => {
      const resp = await crmOptionApi.find({
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
    "crm-module-option-count",
    "Count crm module option",
    "Count crm module option entities with optional filters.",
    crmOptionApi,
  );

  mcp.registerTool(
    "crm-module-option-get",
    {
      title: "List of crm module options",
      description: "Get list of all options from crm module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await crmOptionApi.find({
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
    "crm-module-option-get-by-id",
    {
      title: "Get crm module option by id",
      description: "Get a option from crm module by id.",
      inputSchema: {
        id: crmOptionInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmOptionApi.findById({
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
    "crm-module-option-post",
    {
      title: "Create crm module option",
      description: "Create a new option in the crm module.",
      inputSchema: crmOptionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await crmOptionApi.create({
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
    "crm-module-option-patch",
    {
      title: "Update crm module option by id",
      description: "Update an existing option in the crm module by id.",
      inputSchema: crmOptionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await crmOptionApi.update({
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
    "crm-module-option-delete",
    {
      title: "Delete crm module option by id",
      description: "Delete an existing option in the crm module by id.",
      inputSchema: crmOptionInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await crmOptionApi.delete({
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
