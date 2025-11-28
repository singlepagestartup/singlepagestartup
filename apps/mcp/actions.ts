import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const WidgetSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const mcp = new McpServer({
  name: "singlepagestartup-mcp",
  version: "1.0.0",
});

mcp.registerResource(
  "widget-preview",
  new ResourceTemplate(
    "http://localhost:4000/api/{module}/widgets/{widgetId}",
    {
      list: undefined,
    },
  ),
  {
    title: "Widget Preview Resource",
    description:
      "Динамический генератор превью для виджетов в указанных модулях.",
  },
  async (uri, { module, widgetId }) => {
    const resp = await fetch(
      `http://localhost:4000/api/${module}/widgets/${widgetId}`,
    );

    if (!resp.ok) {
      return {
        contents: [{ uri: uri.href, blob: `Widget not found (${uri.href})` }],
      };
    }

    const widget = WidgetSchema.parse(await resp.json());

    return {
      contents: [
        {
          uri: uri.href,
          text: `Превью виджета: ${widget.title}\nОписание: ${widget.description}\nМодуль: ${module}`,
        },
      ],
    };
  },
);

mcp.registerTool(
  "get-widget-preview",
  {
    title: "Get Widget Preview",
    description: "Получить превью виджета из указанного модуля",
    inputSchema: {
      module: z.string(),
      widgetId: z.string(),
    },
  },
  async (args) => {
    console.log("🚀 ~ args:", args);
    const { module, widgetId } = args as { module: string; widgetId: string };

    try {
      const resp = await fetch(
        `http://localhost:4000/api/${module}/widgets/${widgetId}`,
      );

      if (!resp.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Виджет не найден: ${module}/${widgetId}`,
            },
          ],
        };
      }

      const widget = WidgetSchema.parse(await resp.json());

      return {
        content: [
          {
            type: "text",
            text: `Превью виджета: ${widget.title}\nОписание: ${widget.description}\nМодуль: ${module}\nID: ${widgetId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Ошибка при получении виджета: ${error}`,
          },
        ],
      };
    }
  },
);
