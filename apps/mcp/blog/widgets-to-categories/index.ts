import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogWidgetsToCategoriesApi } from "@sps/blog/relations/widgets-to-categories/sdk/server";
import { insertSchema as blogWidgetsToCategoriesInsertSchema } from "@sps/blog/relations/widgets-to-categories/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-widgets-to-categories",
    "sps://blog/widgets-to-categories",
    {
      title: "blog widgets-to-categories relation",
      description:
        "Get list of all widgets-to-categories relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogWidgetsToCategoriesApi.find({
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
    "blog-widgets-to-categories-count",
    "Count blog widgets to categories",
    "Count blog widgets to categories entities with optional filters.",
    blogWidgetsToCategoriesApi,
  );

  mcp.registerTool(
    "blog-widgets-to-categories-get",
    {
      title: "List of blog widgets-to-categories relations",
      description:
        "Get list of all widgets-to-categories relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogWidgetsToCategoriesApi.find({
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
    "blog-widgets-to-categories-get-by-id",
    {
      title: "Get blog widgets-to-categories relation by id",
      description: "Get a widgets-to-categories relation by id.",
      inputSchema: {
        id: blogWidgetsToCategoriesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogWidgetsToCategoriesApi.findById({
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
    "blog-widgets-to-categories-post",
    {
      title: "Create blog widgets-to-categories relation",
      description:
        "Create a new widgets-to-categories relation in the blog module.",
      inputSchema: blogWidgetsToCategoriesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogWidgetsToCategoriesApi.create({
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
    "blog-widgets-to-categories-patch",
    {
      title: "Update blog widgets-to-categories relation by id",
      description: "Update an existing widgets-to-categories relation by id.",
      inputSchema: blogWidgetsToCategoriesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogWidgetsToCategoriesApi.update({
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
    "blog-widgets-to-categories-delete",
    {
      title: "Delete blog widgets-to-categories relation by id",
      description: "Delete an existing widgets-to-categories relation by id.",
      inputSchema: blogWidgetsToCategoriesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogWidgetsToCategoriesApi.delete({
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
