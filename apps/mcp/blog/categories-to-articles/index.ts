import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogCategoriesToArticlesApi } from "@sps/blog/relations/categories-to-articles/sdk/server";
import { insertSchema as blogCategoriesToArticlesInsertSchema } from "@sps/blog/relations/categories-to-articles/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-categories-to-articles",
    "sps://blog/categories-to-articles",
    {
      title: "blog categories-to-articles relation",
      description:
        "Get list of all categories-to-articles relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogCategoriesToArticlesApi.find({
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
    "blog-categories-to-articles-count",
    "Count blog categories to articles",
    "Count blog categories to articles entities with optional filters.",
    blogCategoriesToArticlesApi,
  );

  mcp.registerTool(
    "blog-categories-to-articles-get",
    {
      title: "List of blog categories-to-articles relations",
      description:
        "Get list of all categories-to-articles relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogCategoriesToArticlesApi.find({
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
    "blog-categories-to-articles-get-by-id",
    {
      title: "Get blog categories-to-articles relation by id",
      description: "Get a categories-to-articles relation by id.",
      inputSchema: {
        id: blogCategoriesToArticlesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogCategoriesToArticlesApi.findById({
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
    "blog-categories-to-articles-post",
    {
      title: "Create blog categories-to-articles relation",
      description:
        "Create a new categories-to-articles relation in the blog module.",
      inputSchema: blogCategoriesToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogCategoriesToArticlesApi.create({
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
    "blog-categories-to-articles-patch",
    {
      title: "Update blog categories-to-articles relation by id",
      description: "Update an existing categories-to-articles relation by id.",
      inputSchema: blogCategoriesToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogCategoriesToArticlesApi.update({
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
    "blog-categories-to-articles-delete",
    {
      title: "Delete blog categories-to-articles relation by id",
      description: "Delete an existing categories-to-articles relation by id.",
      inputSchema: blogCategoriesToArticlesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogCategoriesToArticlesApi.delete({
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
