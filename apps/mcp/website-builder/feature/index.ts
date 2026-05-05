import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderFeatureApi } from "@sps/website-builder/models/feature/sdk/server";
import { insertSchema as websiteBuilderFeatureInsertSchema } from "@sps/website-builder/models/feature/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-module-features",
    "sps://website-builder/features",
    {
      title: "website-builder module features",
      description: "Get list of all features from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderFeatureApi.find({
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
    "website-builder-module-feature-count",
    "Count website builder module feature",
    "Count website builder module feature entities with optional filters.",
    websiteBuilderFeatureApi,
  );

  mcp.registerTool(
    "website-builder-module-feature-get",
    {
      title: "List of website-builder module features",
      description: "Get list of all features from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderFeatureApi.find({
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
    "website-builder-module-feature-get-by-id",
    {
      title: "Get website-builder module feature by id",
      description: "Get a feature from website-builder module by id.",
      inputSchema: {
        id: websiteBuilderFeatureInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderFeatureApi.findById({
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
    "website-builder-module-feature-post",
    {
      title: "Create website-builder module feature",
      description: "Create a new feature in the website-builder module.",
      inputSchema: websiteBuilderFeatureInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderFeatureApi.create({
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
    "website-builder-module-feature-patch",
    {
      title: "Update website-builder module feature by id",
      description:
        "Update an existing feature in the website-builder module by id.",
      inputSchema: websiteBuilderFeatureInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderFeatureApi.update({
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
    "website-builder-module-feature-delete",
    {
      title: "Delete website-builder module feature by id",
      description:
        "Delete an existing feature in the website-builder module by id.",
      inputSchema: websiteBuilderFeatureInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderFeatureApi.delete({
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
