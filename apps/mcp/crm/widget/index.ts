import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmWidgetApi } from "@sps/crm/models/widget/sdk/server";
import { insertSchema as crmWidgetInsertSchema } from "@sps/crm/models/widget/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-module-widgets",
    "sps://crm/widgets",
    {
      title: "crm module widgets",
      description: "Get list of all widgets from crm module",
    },
    async (uri, extra) => {
      const resp = await crmWidgetApi.find({
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
    "crm-module-widget-count",
    "Count crm module widget",
    "Count crm module widget entities with optional filters.",
    crmWidgetApi,
  );

  mcp.registerTool(
    "crm-module-widget-get",
    {
      title: "List of crm module widgets",
      description: "Get list of all widgets from crm module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await crmWidgetApi.find({
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
    "crm-module-widget-get-by-id",
    {
      title: "Get crm module widget by id",
      description: "Get a widget from crm module by id.",
      inputSchema: {
        id: crmWidgetInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmWidgetApi.findById({
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
    "crm-module-widget-post",
    {
      title: "Create crm module widget",
      description: "Create a new widget in the crm module.",
      inputSchema: crmWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await crmWidgetApi.create({
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
    "crm-module-widget-patch",
    {
      title: "Update crm module widget by id",
      description: "Update an existing widget in the crm module by id.",
      inputSchema: crmWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await crmWidgetApi.update({
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
    "crm-module-widget-delete",
    {
      title: "Delete crm module widget by id",
      description: "Delete an existing widget in the crm module by id.",
      inputSchema: crmWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await crmWidgetApi.delete({
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
