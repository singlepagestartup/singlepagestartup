import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialAttributeApi } from "@sps/social/models/attribute/sdk/server";
import { insertSchema as socialAttributeInsertSchema } from "@sps/social/models/attribute/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-module-attributes",
    "sps://social/attributes",
    {
      title: "social module attributes",
      description: "Get list of all attributes from social module",
    },
    async (uri) => {
      const resp = await socialAttributeApi.find();

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
    "social-module-attribute-count",
    "Count social module attribute",
    "Count social module attribute entities with optional filters.",
    socialAttributeApi,
  );

  mcp.registerTool(
    "social-module-attribute-get",
    {
      title: "List of social module attributes",
      description: "Get list of all attributes from social module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await socialAttributeApi.find({
          options: {
            headers: {},
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
    "social-module-attribute-get-by-id",
    {
      title: "Get social module attribute by id",
      description: "Get a attribute from social module by id.",
      inputSchema: {
        id: socialAttributeInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialAttributeApi.findById({
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
    "social-module-attribute-post",
    {
      title: "Create social module attribute",
      description: "Create a new attribute in the social module.",
      inputSchema: socialAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await socialAttributeApi.create({
          data: args,
          options: {
            headers: {},
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
    "social-module-attribute-patch",
    {
      title: "Update social module attribute by id",
      description: "Update an existing attribute in the social module by id.",
      inputSchema: socialAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialAttributeApi.update({
          id: args.id,
          data: args,
          options: {
            headers: {},
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
    "social-module-attribute-delete",
    {
      title: "Delete social module attribute by id",
      description: "Delete an existing attribute in the social module by id.",
      inputSchema: socialAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialAttributeApi.delete({
          id: args.id,
          options: {
            headers: {},
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
