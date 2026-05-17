import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as crmRequestApi } from "@sps/crm/models/request/sdk/server";
import { insertSchema as crmRequestInsertSchema } from "@sps/crm/models/request/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "crm-module-requests",
    "sps://crm/requests",
    {
      title: "crm module requests",
      description: "Get list of all requests from crm module",
    },
    async (uri) => {
      const resp = await crmRequestApi.find();

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
    "crm-module-request-count",
    "Count crm module request",
    "Count crm module request entities with optional filters.",
    crmRequestApi,
  );

  mcp.registerTool(
    "crm-module-request-get",
    {
      title: "List of crm module requests",
      description: "Get list of all requests from crm module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await crmRequestApi.find({
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
    "crm-module-request-get-by-id",
    {
      title: "Get crm module request by id",
      description: "Get a request from crm module by id.",
      inputSchema: {
        id: crmRequestInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await crmRequestApi.findById({
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
    "crm-module-request-post",
    {
      title: "Create crm module request",
      description: "Create a new request in the crm module.",
      inputSchema: crmRequestInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await crmRequestApi.create({
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
    "crm-module-request-patch",
    {
      title: "Update crm module request by id",
      description: "Update an existing request in the crm module by id.",
      inputSchema: crmRequestInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await crmRequestApi.update({
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
    "crm-module-request-delete",
    {
      title: "Delete crm module request by id",
      description: "Delete an existing request in the crm module by id.",
      inputSchema: crmRequestInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await crmRequestApi.delete({
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
