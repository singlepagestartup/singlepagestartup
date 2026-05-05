import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api as analyticMetricApi } from "@sps/analytic/models/metric/sdk/server";
import { insertSchema as analyticMetricInsertSchema } from "@sps/analytic/models/metric/sdk/model";
import { getMcpAuthHeaders } from "../../lib/auth";
import { registerCountTool } from "../../lib/count-tool";

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "analytic-module-metrics",
    "sps://analytic/metrics",
    {
      title: "analytic module metrics",
      description: "Get list of all metrics from analytic module",
    },
    async (uri, extra) => {
      const resp = await analyticMetricApi.find({
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
    "analytic-module-metric-count",
    "Count analytic module metric",
    "Count analytic module metric entities with optional filters.",
    analyticMetricApi,
  );

  mcp.registerTool(
    "analytic-module-metric-get",
    {
      title: "List of analytic module metrics",
      description: "Get list of all metrics from analytic module.",
      inputSchema: {},
    },
    async (_args, extra) => {
      try {
        const entities = await analyticMetricApi.find({
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
    "analytic-module-metric-get-by-id",
    {
      title: "Get analytic module metric by id",
      description: "Get a metric from analytic module by id.",
      inputSchema: {
        id: analyticMetricInsertSchema.shape.id,
      },
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required");
        }

        const entity = await analyticMetricApi.findById({
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
    "analytic-module-metric-post",
    {
      title: "Create analytic module metric",
      description: "Create a new metric in the analytic module.",
      inputSchema: analyticMetricInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        const entity = await analyticMetricApi.create({
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
    "analytic-module-metric-patch",
    {
      title: "Update analytic module metric by id",
      description: "Update an existing metric in the analytic module by id.",
      inputSchema: analyticMetricInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for update");
        }

        const entity = await analyticMetricApi.update({
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
    "analytic-module-metric-delete",
    {
      title: "Delete analytic module metric by id",
      description: "Delete an existing metric in the analytic module by id.",
      inputSchema: analyticMetricInsertSchema.shape,
    },
    async (args, extra) => {
      try {
        if (!args.id) {
          throw new Error("id is required for delete");
        }

        const entity = await analyticMetricApi.delete({
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
