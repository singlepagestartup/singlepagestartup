import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as socialProfilesToAttributesApi } from "@sps/social/relations/profiles-to-attributes/sdk/server";
import { insertSchema as socialProfilesToAttributesInsertSchema } from "@sps/social/relations/profiles-to-attributes/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "social-relations-profiles-to-attributes",
    "sps://social/profiles-to-attributes",
    {
      title: "social profiles-to-attributes relation",
      description:
        "Get list of all profiles-to-attributes relations from social module",
    },
    async (uri, extra) => {
      const resp = await socialProfilesToAttributesApi.find({
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
    "social-profiles-to-attributes-count",
    "Count social profiles to attributes",
    "Count social profiles to attributes entities with optional filters.",
    socialProfilesToAttributesApi,
  );

  mcp.registerTool(
    "social-profiles-to-attributes-get",
    {
      title: "List of social profiles-to-attributes relations",
      description:
        "Get list of all profiles-to-attributes relations from social module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await socialProfilesToAttributesApi.find({
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
    "social-profiles-to-attributes-get-by-id",
    {
      title: "Get social profiles-to-attributes relation by id",
      description: "Get a profiles-to-attributes relation by id.",
      inputSchema: {
        id: socialProfilesToAttributesInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await socialProfilesToAttributesApi.findById({
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
    "social-profiles-to-attributes-post",
    {
      title: "Create social profiles-to-attributes relation",
      description:
        "Create a new profiles-to-attributes relation in the social module.",
      inputSchema: socialProfilesToAttributesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await socialProfilesToAttributesApi.create({
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
    "social-profiles-to-attributes-patch",
    {
      title: "Update social profiles-to-attributes relation by id",
      description: "Update an existing profiles-to-attributes relation by id.",
      inputSchema: socialProfilesToAttributesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await socialProfilesToAttributesApi.update({
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
    "social-profiles-to-attributes-delete",
    {
      title: "Delete social profiles-to-attributes relation by id",
      description: "Delete an existing profiles-to-attributes relation by id.",
      inputSchema: socialProfilesToAttributesInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await socialProfilesToAttributesApi.delete({
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
