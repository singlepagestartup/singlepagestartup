import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderSlidersToSlidesApi } from "@sps/website-builder/relations/sliders-to-slides/sdk/server";
import { insertSchema as websiteBuilderSlidersToSlidesInsertSchema } from "@sps/website-builder/relations/sliders-to-slides/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-sliders-to-slides",
    "sps://website-builder/sliders-to-slides",
    {
      title: "website-builder sliders-to-slides relation",
      description:
        "Get list of all sliders-to-slides relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderSlidersToSlidesApi.find({
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
    "website-builder-sliders-to-slides-count",
    "Count website builder sliders to slides",
    "Count website builder sliders to slides entities with optional filters.",
    websiteBuilderSlidersToSlidesApi,
  );

  mcp.registerTool(
    "website-builder-sliders-to-slides-get",
    {
      title: "List of website-builder sliders-to-slides relations",
      description:
        "Get list of all sliders-to-slides relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderSlidersToSlidesApi.find({
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
    "website-builder-sliders-to-slides-get-by-id",
    {
      title: "Get website-builder sliders-to-slides relation by id",
      description: "Get a sliders-to-slides relation by id.",
      inputSchema: {
        id: websiteBuilderSlidersToSlidesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderSlidersToSlidesApi.findById({
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
    "website-builder-sliders-to-slides-post",
    {
      title: "Create website-builder sliders-to-slides relation",
      description:
        "Create a new sliders-to-slides relation in the website-builder module.",
      inputSchema: websiteBuilderSlidersToSlidesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderSlidersToSlidesApi.create({
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
    "website-builder-sliders-to-slides-patch",
    {
      title: "Update website-builder sliders-to-slides relation by id",
      description: "Update an existing sliders-to-slides relation by id.",
      inputSchema: websiteBuilderSlidersToSlidesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderSlidersToSlidesApi.update({
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
    "website-builder-sliders-to-slides-delete",
    {
      title: "Delete website-builder sliders-to-slides relation by id",
      description: "Delete an existing sliders-to-slides relation by id.",
      inputSchema: websiteBuilderSlidersToSlidesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderSlidersToSlidesApi.delete({
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
