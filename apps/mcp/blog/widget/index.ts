import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogWidgetApi } from "@sps/blog/models/widget/sdk/server";
import { insertSchema as blogWidgetInsertSchema } from "@sps/blog/models/widget/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-module-widgets",
    "sps://blog/widgets",
    {
      title: "blog module widgets",
      description: "Get list of all widgets from blog module",
    },
    async (uri, extra) => {
      const resp = await blogWidgetApi.find({
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
    "blog-module-widget-count",
    "Count blog module widget",
    "Count blog module widget entities with optional filters.",
    blogWidgetApi,
  );

  mcp.registerTool(
    "blog-module-widget-get",
    {
      title: "List of blog module widgets",
      description: "Get list of all widgets from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogWidgetApi.find({
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
    "blog-module-widget-get-by-id",
    {
      title: "Get blog module widget by id",
      description: "Get a widget from blog module by id.",
      inputSchema: {
        id: blogWidgetInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogWidgetApi.findById({
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
    "blog-module-widget-post",
    {
      title: "Create blog module widget",
      description: "Create a new widget in the blog module.",
      inputSchema: blogWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogWidgetApi.create({
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
    "blog-module-widget-patch",
    {
      title: "Update blog module widget by id",
      description: "Update an existing widget in the blog module by id.",
      inputSchema: blogWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogWidgetApi.update({
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
    "blog-module-widget-delete",
    {
      title: "Delete blog module widget by id",
      description: "Delete an existing widget in the blog module by id.",
      inputSchema: blogWidgetInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogWidgetApi.delete({
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
