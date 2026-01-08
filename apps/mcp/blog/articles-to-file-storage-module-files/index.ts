import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as blogArticlesToFileStorageModuleFilesApi } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/server";
import { insertSchema as blogArticlesToFileStorageModuleFilesInsertSchema } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "blog-relations-articles-to-file-storage-module-files",
    "sps://blog/articles-to-file-storage-module-files",
    {
      title: "blog articles-to-file-storage-module-files relation",
      description:
        "Get list of all articles-to-file-storage-module-files relations from blog module",
    },
    async (uri) => {
      const resp = await blogArticlesToFileStorageModuleFilesApi.find();

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
  mcp.registerTool(
    "blog-articles-to-file-storage-module-files-get",
    {
      title: "List of blog articles-to-file-storage-module-files relations",
      description:
        "Get list of all articles-to-file-storage-module-files relations from blog module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await blogArticlesToFileStorageModuleFilesApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.findById({
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
    "blog-articles-to-file-storage-module-files-post",
    {
      title: "Create blog articles-to-file-storage-module-files relation",
      description:
        "Create a new articles-to-file-storage-module-files relation in the blog module.",
      inputSchema: blogArticlesToFileStorageModuleFilesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.create({
          data: args,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.update({
          id: args.id,
          data: args,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await blogArticlesToFileStorageModuleFilesApi.delete({
          id: args.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
