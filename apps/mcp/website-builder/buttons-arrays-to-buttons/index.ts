import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderButtonsArraysToButtonsApi } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/server";
import { insertSchema as websiteBuilderButtonsArraysToButtonsInsertSchema } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-buttons-arrays-to-buttons",
    "sps://website-builder/buttons-arrays-to-buttons",
    {
      title: "website-builder buttons-arrays-to-buttons relation",
      description:
        "Get list of all buttons-arrays-to-buttons relations from website-builder module",
    },
    async (uri) => {
      const resp = await websiteBuilderButtonsArraysToButtonsApi.find();

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
    "website-builder-buttons-arrays-to-buttons-get",
    {
      title: "List of website-builder buttons-arrays-to-buttons relations",
      description:
        "Get list of all buttons-arrays-to-buttons relations from website-builder module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await websiteBuilderButtonsArraysToButtonsApi.find({
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
    "website-builder-buttons-arrays-to-buttons-get-by-id",
    {
      title: "Get website-builder buttons-arrays-to-buttons relation by id",
      description: "Get a buttons-arrays-to-buttons relation by id.",
      inputSchema: {
        id: websiteBuilderButtonsArraysToButtonsInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.findById({
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
    "website-builder-buttons-arrays-to-buttons-post",
    {
      title: "Create website-builder buttons-arrays-to-buttons relation",
      description:
        "Create a new buttons-arrays-to-buttons relation in the website-builder module.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.create({
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
    "website-builder-buttons-arrays-to-buttons-patch",
    {
      title: "Update website-builder buttons-arrays-to-buttons relation by id",
      description:
        "Update an existing buttons-arrays-to-buttons relation by id.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.update({
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
    "website-builder-buttons-arrays-to-buttons-delete",
    {
      title: "Delete website-builder buttons-arrays-to-buttons relation by id",
      description:
        "Delete an existing buttons-arrays-to-buttons relation by id.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.delete({
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
