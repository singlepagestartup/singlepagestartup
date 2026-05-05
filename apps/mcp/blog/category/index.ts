import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogCategoryApi } from "@sps/blog/models/category/sdk/server";
import { insertSchema as blogCategoryInsertSchema } from "@sps/blog/models/category/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-module-categories",
    "sps://blog/categories",
    {
      title: "blog module categories",
      description: "Get list of all categories from blog module",
    },
    async (uri, extra) => {
      const resp = await blogCategoryApi.find({
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
    "blog-module-category-count",
    "Count blog module category",
    "Count blog module category entities with optional filters.",
    blogCategoryApi,
  );

  mcp.registerTool(
    "blog-module-category-get",
    {
      title: "List of blog module categories",
      description: "Get list of all categories from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogCategoryApi.find({
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
    "blog-module-category-get-by-id",
    {
      title: "Get blog module category by id",
      description: "Get a category from blog module by id.",
      inputSchema: {
        id: blogCategoryInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogCategoryApi.findById({
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
    "blog-module-category-post",
    {
      title: "Create blog module category",
      description: "Create a new category in the blog module.",
      inputSchema: blogCategoryInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogCategoryApi.create({
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
    "blog-module-category-patch",
    {
      title: "Update blog module category by id",
      description: "Update an existing category in the blog module by id.",
      inputSchema: blogCategoryInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogCategoryApi.update({
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
    "blog-module-category-delete",
    {
      title: "Delete blog module category by id",
      description: "Delete an existing category in the blog module by id.",
      inputSchema: blogCategoryInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogCategoryApi.delete({
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
