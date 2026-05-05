import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToEcommerceModuleProductsApi } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/server";
import { insertSchema as socialProfilesToEcommerceModuleProductsInsertSchema } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-ecommerce-module-products",
    "sps://social/profiles-to-ecommerce-module-products",
    {
      title: "social profiles-to-ecommerce-module-products relation",
      description:
        "Get list of all profiles-to-ecommerce-module-products relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToEcommerceModuleProductsApi.find({
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
    "social-profiles-to-ecommerce-module-products-count",
    "Count social profiles to ecommerce module products",
    "Count social profiles to ecommerce module products entities with optional filters.",
    socialProfilesToEcommerceModuleProductsApi,
  );

  mcp.registerTool(
    "social-profiles-to-ecommerce-module-products-get",
    {
      title: "List of social profiles-to-ecommerce-module-products relations",
      description:
        "Get list of all profiles-to-ecommerce-module-products relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToEcommerceModuleProductsApi.find({
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
    "social-profiles-to-ecommerce-module-products-get-by-id",
    {
      title: "Get social profiles-to-ecommerce-module-products relation by id",
      description:
        "Get a profiles-to-ecommerce-module-products relation by id.",
      inputSchema: {
        id: socialProfilesToEcommerceModuleProductsInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity =
          await socialProfilesToEcommerceModuleProductsApi.findById({
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
    "social-profiles-to-ecommerce-module-products-post",
    {
      title: "Create social profiles-to-ecommerce-module-products relation",
      description:
        "Create a new profiles-to-ecommerce-module-products relation in the social module.",
      inputSchema: socialProfilesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToEcommerceModuleProductsApi.create({
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
    "social-profiles-to-ecommerce-module-products-patch",
    {
      title:
        "Update social profiles-to-ecommerce-module-products relation by id",
      description:
        "Update an existing profiles-to-ecommerce-module-products relation by id.",
      inputSchema: socialProfilesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToEcommerceModuleProductsApi.update({
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
    "social-profiles-to-ecommerce-module-products-delete",
    {
      title:
        "Delete social profiles-to-ecommerce-module-products relation by id",
      description:
        "Delete an existing profiles-to-ecommerce-module-products relation by id.",
      inputSchema: socialProfilesToEcommerceModuleProductsInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToEcommerceModuleProductsApi.delete({
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
