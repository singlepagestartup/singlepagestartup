import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticleApi } from "@sps/blog/models/article/sdk/server";
import { insertSchema as blogArticleInsertSchema } from "@sps/blog/models/article/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-module-articles",
    "sps://blog/articles",
    {
      title: "blog module articles",
      description: "Get list of all articles from blog module",
    },
    async (uri, extra) => {
      const resp = await blogArticleApi.find({
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
    "blog-module-article-count",
    "Count blog module article",
    "Count blog module article entities with optional filters.",
    blogArticleApi,
  );

  mcp.registerTool(
    "blog-module-article-get",
    {
      title: "List of blog module articles",
      description: "Get list of all articles from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogArticleApi.find({
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
    "blog-module-article-get-by-id",
    {
      title: "Get blog module article by id",
      description: "Get a article from blog module by id.",
      inputSchema: {
        id: blogArticleInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogArticleApi.findById({
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
    "blog-module-article-post",
    {
      title: "Create blog module article",
      description: "Create a new article in the blog module.",
      inputSchema: blogArticleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogArticleApi.create({
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
    "blog-module-article-patch",
    {
      title: "Update blog module article by id",
      description: "Update an existing article in the blog module by id.",
      inputSchema: blogArticleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogArticleApi.update({
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
    "blog-module-article-delete",
    {
      title: "Delete blog module article by id",
      description: "Delete an existing article in the blog module by id.",
      inputSchema: blogArticleInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogArticleApi.delete({
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
