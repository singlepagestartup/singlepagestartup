import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as hostModuleLayoutApi } from "@sps/host/models/layout/sdk/server";
import { insertSchema as hostModuleLayoutInsertSchema } from "@sps/host/models/layout/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "host-module-layouts",
    "sps://host/layouts",
    {
      title: "host module layouts",
      description: "Get list of all layouts from host module",
    },
    async (uri, extra) => {
      const resp = await hostModuleLayoutApi.find({
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
    "host-module-layout-count",
    "Count host module layout",
    "Count host module layout entities with optional filters.",
    hostModuleLayoutApi,
  );

  mcp.registerTool(
    "host-module-layout-get",
    {
      title: "List of host module layouts",
      description: "Get list of all layouts from host module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await hostModuleLayoutApi.find({
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
    "host-module-layout-get-by-id",
    {
      title: "Get host module layout by id",
      description: "Get a layout from host module by id.",
      inputSchema: {
        id: hostModuleLayoutInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await hostModuleLayoutApi.findById({
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
    "host-module-layout-post",
    {
      title: "Create host module layout",
      description: "Create a new layout in the host module.",
      inputSchema: hostModuleLayoutInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await hostModuleLayoutApi.create({
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
    "host-module-layout-patch",
    {
      title: "Update host module layout by id",
      description: "Update an existing layout in the host module by id.",
      inputSchema: hostModuleLayoutInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await hostModuleLayoutApi.update({
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
    "host-module-layout-delete",
    {
      title: "Delete host module layout by id",
      description: "Delete an existing layout in the host module by id.",
      inputSchema: hostModuleLayoutInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await hostModuleLayoutApi.delete({
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
