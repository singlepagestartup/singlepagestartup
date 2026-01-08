import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderFeaturesToButtonsArraysApi } from "@sps/website-builder/relations/features-to-buttons-arrays/sdk/server";
import { insertSchema as websiteBuilderFeaturesToButtonsArraysInsertSchema } from "@sps/website-builder/relations/features-to-buttons-arrays/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-features-to-buttons-arrays",
    "sps://website-builder/features-to-buttons-arrays",
    {
      title: "website-builder features-to-buttons-arrays relation",
      description:
        "Get list of all features-to-buttons-arrays relations from website-builder module",
    },
    async (uri) => {
      const resp = await websiteBuilderFeaturesToButtonsArraysApi.find();

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
    "website-builder-features-to-buttons-arrays-get",
    {
      title: "List of website-builder features-to-buttons-arrays relations",
      description:
        "Get list of all features-to-buttons-arrays relations from website-builder module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await websiteBuilderFeaturesToButtonsArraysApi.find({
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
    "website-builder-features-to-buttons-arrays-get-by-id",
    {
      title: "Get website-builder features-to-buttons-arrays relation by id",
      description: "Get a features-to-buttons-arrays relation by id.",
      inputSchema: {
        id: websiteBuilderFeaturesToButtonsArraysInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderFeaturesToButtonsArraysApi.findById({
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
    "website-builder-features-to-buttons-arrays-post",
    {
      title: "Create website-builder features-to-buttons-arrays relation",
      description:
        "Create a new features-to-buttons-arrays relation in the website-builder module.",
      inputSchema: websiteBuilderFeaturesToButtonsArraysInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderFeaturesToButtonsArraysApi.create({
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
    "website-builder-features-to-buttons-arrays-patch",
    {
      title: "Update website-builder features-to-buttons-arrays relation by id",
      description:
        "Update an existing features-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderFeaturesToButtonsArraysInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderFeaturesToButtonsArraysApi.update({
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
    "website-builder-features-to-buttons-arrays-delete",
    {
      title: "Delete website-builder features-to-buttons-arrays relation by id",
      description:
        "Delete an existing features-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderFeaturesToButtonsArraysInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderFeaturesToButtonsArraysApi.delete({
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
