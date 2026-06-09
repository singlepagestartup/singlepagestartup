import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { insertSchema as ecommerceAttributeInsertSchema } from "@sps/ecommerce/models/attribute/sdk/model";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-module-attributes",
    "sps://ecommerce/attributes",
    {
      title: "ecommerce module attributes",
      description: "Get list of all attributes from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceAttributeApi.find();

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
    "ecommerce-module-attribute-count",
    "Count ecommerce module attribute",
    "Count ecommerce module attribute entities with optional filters.",
    ecommerceAttributeApi,
  );

  mcp.registerTool(
    "ecommerce-module-attribute-get",
    {
      title: "List of ecommerce module attributes",
      description: "Get list of all attributes from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        const entities = await ecommerceAttributeApi.find({
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
    "ecommerce-module-attribute-get-by-id",
    {
      title: "Get ecommerce module attribute by id",
      description: "Get a attribute from ecommerce module by id.",
      inputSchema: {
        id: ecommerceAttributeInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceAttributeApi.findById({
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
    "ecommerce-module-attribute-post",
    {
      title: "Create ecommerce module attribute",
      description: "Create a new attribute in the ecommerce module.",
      inputSchema: ecommerceAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        const entity = await ecommerceAttributeApi.create({
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
    "ecommerce-module-attribute-patch",
    {
      title: "Update ecommerce module attribute by id",
      description:
        "Update an existing attribute in the ecommerce module by id.",
      inputSchema: ecommerceAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await ecommerceAttributeApi.update({
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
    "ecommerce-module-attribute-delete",
    {
      title: "Delete ecommerce module attribute by id",
      description:
        "Delete an existing attribute in the ecommerce module by id.",
      inputSchema: ecommerceAttributeInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await ecommerceAttributeApi.delete({
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
