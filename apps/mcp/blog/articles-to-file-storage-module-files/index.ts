import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticlesToFileStorageModuleFilesApi } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/server";
import { insertSchema as blogArticlesToFileStorageModuleFilesInsertSchema } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-articles-to-file-storage-module-files",
    "sps://blog/articles-to-file-storage-module-files",
    {
      title: "blog articles-to-file-storage-module-files relation",
      description:
        "Get list of all articles-to-file-storage-module-files relations from blog module",
    },
    async (uri, extra) => {
      const resp = await blogArticlesToFileStorageModuleFilesApi.find({
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
    "blog-articles-to-file-storage-module-files-count",
    "Count blog articles to file storage module files",
    "Count blog articles to file storage module files entities with optional filters.",
    blogArticlesToFileStorageModuleFilesApi,
  );

  mcp.registerTool(
    "blog-articles-to-file-storage-module-files-get",
    {
      title: "List of blog articles-to-file-storage-module-files relations",
      description:
        "Get list of all articles-to-file-storage-module-files relations from blog module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await blogArticlesToFileStorageModuleFilesApi.find({
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
    "blog-articles-to-file-storage-module-files-get-by-id",
    {
      title: "Get blog articles-to-file-storage-module-files relation by id",
      description:
        "Get a articles-to-file-storage-module-files relation by id.",
      inputSchema: {
        id: blogArticlesToFileStorageModuleFilesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.findById({
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
    "blog-articles-to-file-storage-module-files-post",
    {
      title: "Create blog articles-to-file-storage-module-files relation",
      description:
        "Create a new articles-to-file-storage-module-files relation in the blog module.",
      inputSchema: blogArticlesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await blogArticlesToFileStorageModuleFilesApi.create({
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
    "blog-articles-to-file-storage-module-files-patch",
    {
      title: "Update blog articles-to-file-storage-module-files relation by id",
      description:
        "Update an existing articles-to-file-storage-module-files relation by id.",
      inputSchema: blogArticlesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.update({
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
    "blog-articles-to-file-storage-module-files-delete",
    {
      title: "Delete blog articles-to-file-storage-module-files relation by id",
      description:
        "Delete an existing articles-to-file-storage-module-files relation by id.",
      inputSchema: blogArticlesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.delete({
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
