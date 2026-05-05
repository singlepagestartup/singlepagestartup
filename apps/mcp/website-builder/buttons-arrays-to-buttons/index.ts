import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderButtonsArraysToButtonsApi } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/server";
import { insertSchema as websiteBuilderButtonsArraysToButtonsInsertSchema } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-buttons-arrays-to-buttons",
    "sps://website-builder/buttons-arrays-to-buttons",
    {
      title: "website-builder buttons-arrays-to-buttons relation",
      description:
        "Get list of all buttons-arrays-to-buttons relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderButtonsArraysToButtonsApi.find({
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
    "website-builder-buttons-arrays-to-buttons-count",
    "Count website builder buttons arrays to buttons",
    "Count website builder buttons arrays to buttons entities with optional filters.",
    websiteBuilderButtonsArraysToButtonsApi,
  );

  mcp.registerTool(
    "website-builder-buttons-arrays-to-buttons-get",
    {
      title: "List of website-builder buttons-arrays-to-buttons relations",
      description:
        "Get list of all buttons-arrays-to-buttons relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderButtonsArraysToButtonsApi.find({
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
    "website-builder-buttons-arrays-to-buttons-get-by-id",
    {
      title: "Get website-builder buttons-arrays-to-buttons relation by id",
      description: "Get a buttons-arrays-to-buttons relation by id.",
      inputSchema: {
        id: websiteBuilderButtonsArraysToButtonsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.findById({
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
    "website-builder-buttons-arrays-to-buttons-post",
    {
      title: "Create website-builder buttons-arrays-to-buttons relation",
      description:
        "Create a new buttons-arrays-to-buttons relation in the website-builder module.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderButtonsArraysToButtonsApi.create({
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
    "website-builder-buttons-arrays-to-buttons-patch",
    {
      title: "Update website-builder buttons-arrays-to-buttons relation by id",
      description:
        "Update an existing buttons-arrays-to-buttons relation by id.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.update({
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
    "website-builder-buttons-arrays-to-buttons-delete",
    {
      title: "Delete website-builder buttons-arrays-to-buttons relation by id",
      description:
        "Delete an existing buttons-arrays-to-buttons relation by id.",
      inputSchema: websiteBuilderButtonsArraysToButtonsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderButtonsArraysToButtonsApi.delete({
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
