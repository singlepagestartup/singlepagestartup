import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderWidgetsToFeaturesApi } from "@sps/website-builder/relations/widgets-to-features/sdk/server";
import { insertSchema as websiteBuilderWidgetsToFeaturesInsertSchema } from "@sps/website-builder/relations/widgets-to-features/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-widgets-to-features",
    "sps://website-builder/widgets-to-features",
    {
      title: "website-builder widgets-to-features relation",
      description:
        "Get list of all widgets-to-features relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderWidgetsToFeaturesApi.find({
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
    "website-builder-widgets-to-features-count",
    "Count website builder widgets to features",
    "Count website builder widgets to features entities with optional filters.",
    websiteBuilderWidgetsToFeaturesApi,
  );

  mcp.registerTool(
    "website-builder-widgets-to-features-get",
    {
      title: "List of website-builder widgets-to-features relations",
      description:
        "Get list of all widgets-to-features relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderWidgetsToFeaturesApi.find({
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
    "website-builder-widgets-to-features-get-by-id",
    {
      title: "Get website-builder widgets-to-features relation by id",
      description: "Get a widgets-to-features relation by id.",
      inputSchema: {
        id: websiteBuilderWidgetsToFeaturesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderWidgetsToFeaturesApi.findById({
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
    "website-builder-widgets-to-features-post",
    {
      title: "Create website-builder widgets-to-features relation",
      description:
        "Create a new widgets-to-features relation in the website-builder module.",
      inputSchema: websiteBuilderWidgetsToFeaturesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderWidgetsToFeaturesApi.create({
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
    "website-builder-widgets-to-features-patch",
    {
      title: "Update website-builder widgets-to-features relation by id",
      description: "Update an existing widgets-to-features relation by id.",
      inputSchema: websiteBuilderWidgetsToFeaturesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderWidgetsToFeaturesApi.update({
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
    "website-builder-widgets-to-features-delete",
    {
      title: "Delete website-builder widgets-to-features relation by id",
      description: "Delete an existing widgets-to-features relation by id.",
      inputSchema: websiteBuilderWidgetsToFeaturesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderWidgetsToFeaturesApi.delete({
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
