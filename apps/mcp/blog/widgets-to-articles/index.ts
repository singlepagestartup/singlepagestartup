import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogWidgetsToArticlesApi } from "@sps/blog/relations/widgets-to-articles/sdk/server";
import { insertSchema as blogWidgetsToArticlesInsertSchema } from "@sps/blog/relations/widgets-to-articles/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-widgets-to-articles",
    "sps://blog/widgets-to-articles",
    {
      title: "blog widgets-to-articles relation",
      description:
        "Get list of all widgets-to-articles relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogWidgetsToArticlesApi.find({
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
    "blog-widgets-to-articles-count",
    "Count blog widgets to articles",
    "Count blog widgets to articles entities with optional filters.",
    blogWidgetsToArticlesApi,
  );

  mcp.registerTool(
    "blog-widgets-to-articles-get",
    {
      title: "List of blog widgets-to-articles relations",
      description:
        "Get list of all widgets-to-articles relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogWidgetsToArticlesApi.find({
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
    "blog-widgets-to-articles-get-by-id",
    {
      title: "Get blog widgets-to-articles relation by id",
      description: "Get a widgets-to-articles relation by id.",
      inputSchema: {
        id: blogWidgetsToArticlesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogWidgetsToArticlesApi.findById({
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
    "blog-widgets-to-articles-post",
    {
      title: "Create blog widgets-to-articles relation",
      description:
        "Create a new widgets-to-articles relation in the blog module.",
      inputSchema: blogWidgetsToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogWidgetsToArticlesApi.create({
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
    "blog-widgets-to-articles-patch",
    {
      title: "Update blog widgets-to-articles relation by id",
      description: "Update an existing widgets-to-articles relation by id.",
      inputSchema: blogWidgetsToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogWidgetsToArticlesApi.update({
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
    "blog-widgets-to-articles-delete",
    {
      title: "Delete blog widgets-to-articles relation by id",
      description: "Delete an existing widgets-to-articles relation by id.",
      inputSchema: blogWidgetsToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogWidgetsToArticlesApi.delete({
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
