import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as ecommerceStoresToProductsToAttributesApi } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/server";
import { insertSchema as ecommerceStoresToProductsToAttributesInsertSchema } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "ecommerce-relations-stores-to-products-to-attributes",
    "sps://ecommerce/stores-to-products-to-attributes",
    {
      title: "ecommerce stores-to-products-to-attributes relation",
      description:
        "Get list of all stores-to-products-to-attributes relations from ecommerce module",
    },
    async (uri) => {
      const resp = await ecommerceStoresToProductsToAttributesApi.find();

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
    "ecommerce-stores-to-products-to-attributes-get",
    {
      title: "List of ecommerce stores-to-products-to-attributes relations",
      description:
        "Get list of all stores-to-products-to-attributes relations from ecommerce module.",
      inputSchema: {},
    },
    async () => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entities = await ecommerceStoresToProductsToAttributesApi.find({
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
    "ecommerce-stores-to-products-to-attributes-get-by-id",
    {
      title: "Get ecommerce stores-to-products-to-attributes relation by id",
      description: "Get a stores-to-products-to-attributes relation by id.",
      inputSchema: {
        id: ecommerceStoresToProductsToAttributesInsertSchema.shape.id,
      },
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await ecommerceStoresToProductsToAttributesApi.findById({
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
    "ecommerce-stores-to-products-to-attributes-post",
    {
      title: "Create ecommerce stores-to-products-to-attributes relation",
      description:
        "Create a new stores-to-products-to-attributes relation in the ecommerce module.",
      inputSchema: ecommerceStoresToProductsToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceStoresToProductsToAttributesApi.create({
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
    "ecommerce-stores-to-products-to-attributes-patch",
    {
      title: "Update ecommerce stores-to-products-to-attributes relation by id",
      description:
        "Update an existing stores-to-products-to-attributes relation by id.",
      inputSchema: ecommerceStoresToProductsToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceStoresToProductsToAttributesApi.update({
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
    "ecommerce-stores-to-products-to-attributes-delete",
    {
      title: "Delete ecommerce stores-to-products-to-attributes relation by id",
      description:
        "Delete an existing stores-to-products-to-attributes relation by id.",
      inputSchema: ecommerceStoresToProductsToAttributesInsertSchema.shape,
    },
    async (args) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const entity = await ecommerceStoresToProductsToAttributesApi.delete({
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
