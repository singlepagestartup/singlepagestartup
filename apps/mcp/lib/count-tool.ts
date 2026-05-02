import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { z } from "zod";

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
    params?: z.infer<typeof CountParamsSchema>;
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
    async (args) => {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("RBAC_SECRET_KEY is not set");
        }

        const parsed = CountParamsSchema.safeParse(args);

        if (!parsed.success) {
          throw new Error(parsed.error.message);
        }

        const count = await api.count({
          params: parsed.data,
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
