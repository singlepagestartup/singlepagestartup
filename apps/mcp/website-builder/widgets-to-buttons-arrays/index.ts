import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderWidgetsToButtonsArraysApi } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/server";
import { insertSchema as websiteBuilderWidgetsToButtonsArraysInsertSchema } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-relations-widgets-to-buttons-arrays",
    "sps://website-builder/widgets-to-buttons-arrays",
    {
      title: "website-builder widgets-to-buttons-arrays relation",
      description:
        "Get list of all widgets-to-buttons-arrays relations from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderWidgetsToButtonsArraysApi.find({
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
    "website-builder-widgets-to-buttons-arrays-count",
    "Count website builder widgets to buttons arrays",
    "Count website builder widgets to buttons arrays entities with optional filters.",
    websiteBuilderWidgetsToButtonsArraysApi,
  );

  mcp.registerTool(
    "website-builder-widgets-to-buttons-arrays-get",
    {
      title: "List of website-builder widgets-to-buttons-arrays relations",
      description:
        "Get list of all widgets-to-buttons-arrays relations from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderWidgetsToButtonsArraysApi.find({
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
    "website-builder-widgets-to-buttons-arrays-get-by-id",
    {
      title: "Get website-builder widgets-to-buttons-arrays relation by id",
      description: "Get a widgets-to-buttons-arrays relation by id.",
      inputSchema: {
        id: websiteBuilderWidgetsToButtonsArraysInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderWidgetsToButtonsArraysApi.findById({
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
    "website-builder-widgets-to-buttons-arrays-post",
    {
      title: "Create website-builder widgets-to-buttons-arrays relation",
      description:
        "Create a new widgets-to-buttons-arrays relation in the website-builder module.",
      inputSchema: websiteBuilderWidgetsToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderWidgetsToButtonsArraysApi.create({
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
    "website-builder-widgets-to-buttons-arrays-patch",
    {
      title: "Update website-builder widgets-to-buttons-arrays relation by id",
      description:
        "Update an existing widgets-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderWidgetsToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderWidgetsToButtonsArraysApi.update({
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
    "website-builder-widgets-to-buttons-arrays-delete",
    {
      title: "Delete website-builder widgets-to-buttons-arrays relation by id",
      description:
        "Delete an existing widgets-to-buttons-arrays relation by id.",
      inputSchema: websiteBuilderWidgetsToButtonsArraysInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderWidgetsToButtonsArraysApi.delete({
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
