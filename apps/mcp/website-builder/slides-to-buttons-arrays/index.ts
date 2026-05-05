import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderSlidesToButtonsArraysApi } from "@sps/website-builder/relations/slides-to-buttons-arrays/sdk/server";
import { insertSchema as websiteBuilderSlidesToButtonsArraysInsertSchema } from "@sps/website-builder/relations/slides-to-buttons-arrays/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-slides-to-buttons-arrays",
    "sps://website-builder/slides-to-buttons-arrays",
    {
      title: "website-builder slides-to-buttons-arrays relation",
      description:
        "Get list of all slides-to-buttons-arrays relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderSlidesToButtonsArraysApi.find({
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
    "website-builder-slides-to-buttons-arrays-count",
    "Count website builder slides to buttons arrays",
    "Count website builder slides to buttons arrays entities with optional filters.",
    websiteBuilderSlidesToButtonsArraysApi,
  );

  mcp.registerTool(
    "website-builder-slides-to-buttons-arrays-get",
    {
      title: "List of website-builder slides-to-buttons-arrays relations",
      description:
        "Get list of all slides-to-buttons-arrays relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderSlidesToButtonsArraysApi.find({
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
    "website-builder-slides-to-buttons-arrays-get-by-id",
    {
      title: "Get website-builder slides-to-buttons-arrays relation by id",
      description: "Get a slides-to-buttons-arrays relation by id.",
      inputSchema: {
        id: websiteBuilderSlidesToButtonsArraysInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderSlidesToButtonsArraysApi.findById({
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
    "website-builder-slides-to-buttons-arrays-post",
    {
      title: "Create website-builder slides-to-buttons-arrays relation",
      description:
        "Create a new slides-to-buttons-arrays relation in the website-builder module.",
      inputSchema: websiteBuilderSlidesToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderSlidesToButtonsArraysApi.create({
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
    "website-builder-slides-to-buttons-arrays-patch",
    {
      title: "Update website-builder slides-to-buttons-arrays relation by id",
      description:
        "Update an existing slides-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderSlidesToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderSlidesToButtonsArraysApi.update({
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
    "website-builder-slides-to-buttons-arrays-delete",
    {
      title: "Delete website-builder slides-to-buttons-arrays relation by id",
      description:
        "Delete an existing slides-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderSlidesToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderSlidesToButtonsArraysApi.delete({
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
