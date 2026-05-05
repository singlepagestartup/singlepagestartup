import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticlesToWebsiteBuilderModuleWidgetsApi } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/server";
import { insertSchema as blogArticlesToWebsiteBuilderModuleWidgetsInsertSchema } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-articles-to-website-builder-module-widgets",
    "sps://blog/articles-to-website-builder-module-widgets",
    {
      title: "blog articles-to-website-builder-module-widgets relation",
      description:
        "Get list of all articles-to-website-builder-module-widgets relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogArticlesToWebsiteBuilderModuleWidgetsApi.find({
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
    "blog-articles-to-website-builder-module-widgets-count",
    "Count blog articles to website builder module widgets",
    "Count blog articles to website builder module widgets entities with optional filters.",
    blogArticlesToWebsiteBuilderModuleWidgetsApi,
  );

  mcp.registerTool(
    "blog-articles-to-website-builder-module-widgets-get",
    {
      title:
        "List of blog articles-to-website-builder-module-widgets relations",
      description:
        "Get list of all articles-to-website-builder-module-widgets relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities =
          await blogArticlesToWebsiteBuilderModuleWidgetsApi.find({
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
    "blog-articles-to-website-builder-module-widgets-get-by-id",
    {
      title:
        "Get blog articles-to-website-builder-module-widgets relation by id",
      description:
        "Get a articles-to-website-builder-module-widgets relation by id.",
      inputSchema: {
        id: blogArticlesToWebsiteBuilderModuleWidgetsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await blogArticlesToWebsiteBuilderModuleWidgetsApi.findById({
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
    "blog-articles-to-website-builder-module-widgets-post",
    {
      title: "Create blog articles-to-website-builder-module-widgets relation",
      description:
        "Create a new articles-to-website-builder-module-widgets relation in the blog module.",
      inputSchema: blogArticlesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity =
          await blogArticlesToWebsiteBuilderModuleWidgetsApi.create({
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
    "blog-articles-to-website-builder-module-widgets-patch",
    {
      title:
        "Update blog articles-to-website-builder-module-widgets relation by id",
      description:
        "Update an existing articles-to-website-builder-module-widgets relation by id.",
      inputSchema: blogArticlesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity =
          await blogArticlesToWebsiteBuilderModuleWidgetsApi.update({
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
    "blog-articles-to-website-builder-module-widgets-delete",
    {
      title:
        "Delete blog articles-to-website-builder-module-widgets relation by id",
      description:
        "Delete an existing articles-to-website-builder-module-widgets relation by id.",
      inputSchema: blogArticlesToWebsiteBuilderModuleWidgetsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity =
          await blogArticlesToWebsiteBuilderModuleWidgetsApi.delete({
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
