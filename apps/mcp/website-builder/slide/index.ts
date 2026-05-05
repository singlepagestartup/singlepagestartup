import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderSlideApi } from "@sps/website-builder/models/slide/sdk/server";
import { insertSchema as websiteBuilderSlideInsertSchema } from "@sps/website-builder/models/slide/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-module-slides",
    "sps://website-builder/slides",
    {
      title: "website-builder module slides",
      description: "Get list of all slides from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderSlideApi.find({
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
    "website-builder-module-slide-count",
    "Count website builder module slide",
    "Count website builder module slide entities with optional filters.",
    websiteBuilderSlideApi,
  );

  mcp.registerTool(
    "website-builder-module-slide-get",
    {
      title: "List of website-builder module slides",
      description: "Get list of all slides from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderSlideApi.find({
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
    "website-builder-module-slide-get-by-id",
    {
      title: "Get website-builder module slide by id",
      description: "Get a slide from website-builder module by id.",
      inputSchema: {
        id: websiteBuilderSlideInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderSlideApi.findById({
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
    "website-builder-module-slide-post",
    {
      title: "Create website-builder module slide",
      description: "Create a new slide in the website-builder module.",
      inputSchema: websiteBuilderSlideInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderSlideApi.create({
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
    "website-builder-module-slide-patch",
    {
      title: "Update website-builder module slide by id",
      description:
        "Update an existing slide in the website-builder module by id.",
      inputSchema: websiteBuilderSlideInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderSlideApi.update({
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
    "website-builder-module-slide-delete",
    {
      title: "Delete website-builder module slide by id",
      description:
        "Delete an existing slide in the website-builder module by id.",
      inputSchema: websiteBuilderSlideInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderSlideApi.delete({
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
