import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { insertSchema as ecommerceAttributeKeysToAttributesInsertSchema } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-attribute-keys-to-attributes",
    "sps://ecommerce/attribute-keys-to-attributes",
    {
      title: "ecommerce attribute-keys-to-attributes relation",
      description:
        "Get list of all attribute-keys-to-attributes relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceAttributeKeysToAttributesApi.find();

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
  mcp.registerTool(
    "ecommerce-attribute-keys-to-attributes-get",
    {
      title: "List of ecommerce attribute-keys-to-attributes relations",
      description:
        "Get list of all attribute-keys-to-attributes relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await ecommerceAttributeKeysToAttributesApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    "ecommerce-attribute-keys-to-attributes-get-by-id",
    {
      title: "Get ecommerce attribute-keys-to-attributes relation by id",
      description: "Get a attribute-keys-to-attributes relation by id.",
      inputSchema: {
        id: ecommerceAttributeKeysToAttributesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceAttributeKeysToAttributesApi.findById({
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
    "ecommerce-attribute-keys-to-attributes-post",
    {
      title: "Create ecommerce attribute-keys-to-attributes relation",
      description:
        "Create a new attribute-keys-to-attributes relation in the ecommerce module.",
      inputSchema: ecommerceAttributeKeysToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceAttributeKeysToAttributesApi.create({
          data: args,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    "ecommerce-attribute-keys-to-attributes-patch",
    {
      title: "Update ecommerce attribute-keys-to-attributes relation by id",
      description:
        "Update an existing attribute-keys-to-attributes relation by id.",
      inputSchema: ecommerceAttributeKeysToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceAttributeKeysToAttributesApi.update({
          id: args.id,
          data: args,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
    "ecommerce-attribute-keys-to-attributes-delete",
    {
      title: "Delete ecommerce attribute-keys-to-attributes relation by id",
      description:
        "Delete an existing attribute-keys-to-attributes relation by id.",
      inputSchema: ecommerceAttributeKeysToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceAttributeKeysToAttributesApi.delete({
          id: args.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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
