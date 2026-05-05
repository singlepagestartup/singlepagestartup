import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderWidgetsToLogotypesApi } from "@sps/website-builder/relations/widgets-to-logotypes/sdk/server";
import { insertSchema as websiteBuilderWidgetsToLogotypesInsertSchema } from "@sps/website-builder/relations/widgets-to-logotypes/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-widgets-to-logotypes",
    "sps://website-builder/widgets-to-logotypes",
    {
      title: "website-builder widgets-to-logotypes relation",
      description:
        "Get list of all widgets-to-logotypes relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderWidgetsToLogotypesApi.find({
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
    "website-builder-widgets-to-logotypes-count",
    "Count website builder widgets to logotypes",
    "Count website builder widgets to logotypes entities with optional filters.",
    websiteBuilderWidgetsToLogotypesApi,
  );

  mcp.registerTool(
    "website-builder-widgets-to-logotypes-get",
    {
      title: "List of website-builder widgets-to-logotypes relations",
      description:
        "Get list of all widgets-to-logotypes relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderWidgetsToLogotypesApi.find({
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
    "website-builder-widgets-to-logotypes-get-by-id",
    {
      title: "Get website-builder widgets-to-logotypes relation by id",
      description: "Get a widgets-to-logotypes relation by id.",
      inputSchema: {
        id: websiteBuilderWidgetsToLogotypesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderWidgetsToLogotypesApi.findById({
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
    "website-builder-widgets-to-logotypes-post",
    {
      title: "Create website-builder widgets-to-logotypes relation",
      description:
        "Create a new widgets-to-logotypes relation in the website-builder module.",
      inputSchema: websiteBuilderWidgetsToLogotypesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderWidgetsToLogotypesApi.create({
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
    "website-builder-widgets-to-logotypes-patch",
    {
      title: "Update website-builder widgets-to-logotypes relation by id",
      description: "Update an existing widgets-to-logotypes relation by id.",
      inputSchema: websiteBuilderWidgetsToLogotypesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderWidgetsToLogotypesApi.update({
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
    "website-builder-widgets-to-logotypes-delete",
    {
      title: "Delete website-builder widgets-to-logotypes relation by id",
      description: "Delete an existing widgets-to-logotypes relation by id.",
      inputSchema: websiteBuilderWidgetsToLogotypesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderWidgetsToLogotypesApi.delete({
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
