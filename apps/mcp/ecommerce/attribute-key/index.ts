import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { insertSchema as ecommerceAttributeKeyInsertSchema } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-module-attribute-keys",
    "sps://ecommerce/attribute-keys",
    {
      title: "ecommerce module attribute-keys",
      description: "Get list of all attribute-keys from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceAttributeKeyApi.find();

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
    "ecommerce-module-attribute-key-count",
    "Count ecommerce module attribute key",
    "Count ecommerce module attribute key entities with optional filters.",
    ecommerceAttributeKeyApi,
  );

  mcp.registerTool(
    "ecommerce-module-attribute-key-get",
    {
      title: "List of ecommerce module attribute-keys",
      description: "Get list of all attribute-keys from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await ecommerceAttributeKeyApi.find({
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
    "ecommerce-module-attribute-key-get-by-id",
    {
      title: "Get ecommerce module attribute-key by id",
      description: "Get a attribute-key from ecommerce module by id.",
      inputSchema: {
        id: ecommerceAttributeKeyInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceAttributeKeyApi.findById({
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
    "ecommerce-module-attribute-key-post",
    {
      title: "Create ecommerce module attribute-key",
      description: "Create a new attribute-key in the ecommerce module.",
      inputSchema: ecommerceAttributeKeyInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await ecommerceAttributeKeyApi.create({
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
    "ecommerce-module-attribute-key-patch",
    {
      title: "Update ecommerce module attribute-key by id",
      description:
        "Update an existing attribute-key in the ecommerce module by id.",
      inputSchema: ecommerceAttributeKeyInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceAttributeKeyApi.update({
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
    "ecommerce-module-attribute-key-delete",
    {
      title: "Delete ecommerce module attribute-key by id",
      description:
        "Delete an existing attribute-key in the ecommerce module by id.",
      inputSchema: ecommerceAttributeKeyInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceAttributeKeyApi.delete({
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
