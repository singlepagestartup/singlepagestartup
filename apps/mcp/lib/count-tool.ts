import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAuthFieldsSchema, getMcpAuthHeaders } from "./auth";

const CountFilterMethodSchema = z.enum([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "in",
  "isNull",
  "isNotNull",
]);

const CountParamsSchema = z.object({
  auth: McpAuthFieldsSchema,
  filters: z
    .object({
      and: z
        .array(
          z.object({
            column: z.string(),
            method: CountFilterMethodSchema,
            value: z.union([z.string(), z.number(), z.boolean()]).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

interface ICountableApi {
  count: (props?: {
    params?: Omit<z.infer<typeof CountParamsSchema>, "auth">;
    options?: {
      headers?: Record<string, string>;
    };
  }) => Promise<number | undefined>;
}

export function registerCountTool(
  mcp: McpServer,
  name: string,
  title: string,
  description: string,
  api: ICountableApi,
) {
  mcp.registerTool(
    name,
    {
      title,
      description,
      inputSchema: CountParamsSchema.shape,
    },
    async (args, extra) => {
      try {
        const parsed = CountParamsSchema.safeParse(args);

        if (!parsed.success) {
          throw new Error(parsed.error.message);
        }

        const { auth, ...params } = parsed.data;
        const count = await api.count({
          params,
          options: {
            headers: getMcpAuthHeaders(extra, { auth }),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ data: count }, null, 2),
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
