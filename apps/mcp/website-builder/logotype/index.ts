import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as websiteBuilderLogotypeApi } from "@sps/website-builder/models/logotype/sdk/server";
import { insertSchema as websiteBuilderLogotypeInsertSchema } from "@sps/website-builder/models/logotype/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "website-builder-module-logotypes",
    "sps://website-builder/logotypes",
    {
      title: "website-builder module logotypes",
      description: "Get list of all logotypes from website-builder module",
    },
    async (uri, extra) => {
      const resp = await websiteBuilderLogotypeApi.find({
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
    "website-builder-module-logotype-count",
    "Count website builder module logotype",
    "Count website builder module logotype entities with optional filters.",
    websiteBuilderLogotypeApi,
  );

  mcp.registerTool(
    "website-builder-module-logotype-get",
    {
      title: "List of website-builder module logotypes",
      description: "Get list of all logotypes from website-builder module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await websiteBuilderLogotypeApi.find({
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
    "website-builder-module-logotype-get-by-id",
    {
      title: "Get website-builder module logotype by id",
      description: "Get a logotype from website-builder module by id.",
      inputSchema: {
        id: websiteBuilderLogotypeInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await websiteBuilderLogotypeApi.findById({
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
    "website-builder-module-logotype-post",
    {
      title: "Create website-builder module logotype",
      description: "Create a new logotype in the website-builder module.",
      inputSchema: websiteBuilderLogotypeInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await websiteBuilderLogotypeApi.create({
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
    "website-builder-module-logotype-patch",
    {
      title: "Update website-builder module logotype by id",
      description:
        "Update an existing logotype in the website-builder module by id.",
      inputSchema: websiteBuilderLogotypeInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await websiteBuilderLogotypeApi.update({
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
    "website-builder-module-logotype-delete",
    {
      title: "Delete website-builder module logotype by id",
      description:
        "Delete an existing logotype in the website-builder module by id.",
      inputSchema: websiteBuilderLogotypeInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await websiteBuilderLogotypeApi.delete({
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
