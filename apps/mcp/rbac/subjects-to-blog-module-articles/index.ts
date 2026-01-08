import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as rbacSubjectsToBlogModuleArticlesApi } from "@sps/rbac/relations/subjects-to-blog-module-articles/sdk/server";
import { insertSchema as rbacSubjectsToBlogModuleArticlesInsertSchema } from "@sps/rbac/relations/subjects-to-blog-module-articles/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "rbac-relations-subjects-to-blog-module-articles",
    "sps://rbac/subjects-to-blog-module-articles",
    {
      title: "rbac subjects-to-blog-module-articles relation",
      description:
        "Get list of all subjects-to-blog-module-articles relations from rbac module",
    },
    async (uri) => {
      const resp = await rbacSubjectsToBlogModuleArticlesApi.find();

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
    "rbac-subjects-to-blog-module-articles-get",
    {
      title: "List of rbac subjects-to-blog-module-articles relations",
      description:
        "Get list of all subjects-to-blog-module-articles relations from rbac module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await rbacSubjectsToBlogModuleArticlesApi.find({
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
    "rbac-subjects-to-blog-module-articles-get-by-id",
    {
      title: "Get rbac subjects-to-blog-module-articles relation by id",
      description: "Get a subjects-to-blog-module-articles relation by id.",
      inputSchema: {
        id: rbacSubjectsToBlogModuleArticlesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await rbacSubjectsToBlogModuleArticlesApi.findById({
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
    "rbac-subjects-to-blog-module-articles-post",
    {
      title: "Create rbac subjects-to-blog-module-articles relation",
      description:
        "Create a new subjects-to-blog-module-articles relation in the rbac module.",
      inputSchema: rbacSubjectsToBlogModuleArticlesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToBlogModuleArticlesApi.create({
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
    "rbac-subjects-to-blog-module-articles-patch",
    {
      title: "Update rbac subjects-to-blog-module-articles relation by id",
      description:
        "Update an existing subjects-to-blog-module-articles relation by id.",
      inputSchema: rbacSubjectsToBlogModuleArticlesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToBlogModuleArticlesApi.update({
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
    "rbac-subjects-to-blog-module-articles-delete",
    {
      title: "Delete rbac subjects-to-blog-module-articles relation by id",
      description:
        "Delete an existing subjects-to-blog-module-articles relation by id.",
      inputSchema: rbacSubjectsToBlogModuleArticlesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await rbacSubjectsToBlogModuleArticlesApi.delete({
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
