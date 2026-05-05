import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as hostPagesToWidgetsApi } from "@sps/host/relations/pages-to-widgets/sdk/server";
import { insertSchema as hostPagesToWidgetsInsertSchema } from "@sps/host/relations/pages-to-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "host-relations-pages-to-widgets",
    "sps://host/pages-to-widgets",
    {
      title: "host pages-to-widgets relation",
      description:
        "Get list of all pages-to-widgets relations from host module",
    },
    async (uri, extra) => {
      const resp = await hostPagesToWidgetsApi.find({
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
    "host-pages-to-widgets-count",
    "Count host pages to widgets",
    "Count host pages to widgets entities with optional filters.",
    hostPagesToWidgetsApi,
  );

  mcp.registerTool(
    "host-pages-to-widgets-get",
    {
      title: "List of host pages-to-widgets relations",
      description:
        "Get list of all pages-to-widgets relations from host module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await hostPagesToWidgetsApi.find({
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `${JSON.stringify(entities, null, 2)}`,
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
    "host-pages-to-widgets-get-by-id",
    {
      title: "Get host pages-to-widgets relation by id",
      description: "Get a pages-to-widgets relation by id.",
      inputSchema: {
        id: hostPagesToWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await hostPagesToWidgetsApi.findById({
          id: args.id,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-pages-to-widgets-post",
    {
      title: "Create host pages-to-widgets relation",
      description: "Create a new pages-to-widgets relation in the host module.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await hostPagesToWidgetsApi.create({
          data: args,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-pages-to-widgets-patch",
    {
      title: "Update host pages-to-widgets relation by id",
      description: "Update an existing pages-to-widgets relation by id.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await hostPagesToWidgetsApi.update({
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
              text: `${JSON.stringify(entity, null, 2)}`,
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
    "host-pages-to-widgets-delete",
    {
      title: "Delete host pages-to-widgets relation by id",
      description: "Delete an existing pages-to-widgets relation by id.",
      inputSchema: hostPagesToWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await hostPagesToWidgetsApi.delete({
          id: args.id,
          options: {
            headers: getMcpAuthHeaders(extra),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `${JSON.stringify(entity, null, 2)}`,
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
