import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmWidgetsToFormsApi } from "@sps/crm/relations/widgets-to-forms/sdk/server";
import { insertSchema as crmWidgetsToFormsInsertSchema } from "@sps/crm/relations/widgets-to-forms/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-relations-widgets-to-forms",
    "sps://crm/widgets-to-forms",
    {
      title: "crm widgets-to-forms relation",
      description: "Get list of all widgets-to-forms relations from crm module",
    },
    async (uri, extra) => {
      const resp = await crmWidgetsToFormsApi.find({
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
    "crm-widgets-to-forms-count",
    "Count crm widgets to forms",
    "Count crm widgets to forms entities with optional filters.",
    crmWidgetsToFormsApi,
  );

  mcp.registerTool(
    "crm-widgets-to-forms-get",
    {
      title: "List of crm widgets-to-forms relations",
      description:
        "Get list of all widgets-to-forms relations from crm module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await crmWidgetsToFormsApi.find({
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
    "crm-widgets-to-forms-get-by-id",
    {
      title: "Get crm widgets-to-forms relation by id",
      description: "Get a widgets-to-forms relation by id.",
      inputSchema: {
        id: crmWidgetsToFormsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmWidgetsToFormsApi.findById({
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
    "crm-widgets-to-forms-post",
    {
      title: "Create crm widgets-to-forms relation",
      description: "Create a new widgets-to-forms relation in the crm module.",
      inputSchema: crmWidgetsToFormsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await crmWidgetsToFormsApi.create({
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
    "crm-widgets-to-forms-patch",
    {
      title: "Update crm widgets-to-forms relation by id",
      description: "Update an existing widgets-to-forms relation by id.",
      inputSchema: crmWidgetsToFormsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await crmWidgetsToFormsApi.update({
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
    "crm-widgets-to-forms-delete",
    {
      title: "Delete crm widgets-to-forms relation by id",
      description: "Delete an existing widgets-to-forms relation by id.",
      inputSchema: crmWidgetsToFormsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await crmWidgetsToFormsApi.delete({
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
