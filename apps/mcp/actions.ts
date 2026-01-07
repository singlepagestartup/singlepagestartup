import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { api as websiteBuilderWidgetApi } from "@sps/website-builder/models/widget/sdk/server";

const LocalizedTextSchema = z.union([z.string(), z.record(z.string())]);

const WidgetSchema = z.object({
  title: LocalizedTextSchema.optional(),
  subtitle: LocalizedTextSchema.optional(),
  description: LocalizedTextSchema.optional(),
  slug: z.string().optional(),
  id: z.string().optional(),
  variant: z.string().optional(),
});

const WidgetSeedInputSchema = z.object({
  title: LocalizedTextSchema,
  subtitle: LocalizedTextSchema.optional(),
  description: LocalizedTextSchema.optional(),
  variant: z.string().optional(),
  slug: z.string().optional(),
  adminTitle: z.string().optional(),
  className: z.string().optional(),
  anchor: z.string().optional(),
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

    const payload = await resp.json();
    const widget = WidgetSchema.parse(unwrapWidgetPayload(payload));

    return {
      contents: [
        {
          uri: uri.href,
          text: `ID: ${widget.id || ""}\nПревью виджета: ${localizedToText(widget.title) || widget.slug || ""}\nМодуль: ${module}`,
        },
      ],
    };
  },
);

mcp.registerResource(
  "widgets-all",
  "sps://widgets/website-builder/all",
  {
    title: "All Website Builder Widgets",
    description: "Список всех виджетов модуля website-builder.",
  },
  async (uri) => {
    const resp = await websiteBuilderWidgetApi.find();

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

function toLocalizedText(
  value: z.infer<typeof LocalizedTextSchema> | undefined,
): Record<string, string> {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    return { ru: value };
  }

  return value;
}

function normalizeSlug(value: string | undefined, fallbackId: string): string {
  if (!value) {
    return `widget-${fallbackId.slice(0, 8)}`;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

  return normalized || `widget-${fallbackId.slice(0, 8)}`;
}

function unwrapWidgetPayload(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return data ?? payload;
  }

  return payload;
}

function localizedToText(
  value: z.infer<typeof LocalizedTextSchema> | undefined,
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.ru || value.en || Object.values(value)[0] || "";
}

async function resolveRepoPath(relativePath: string): Promise<string> {
  const direct = path.resolve(process.cwd(), relativePath);
  try {
    await fs.access(direct);
    return direct;
  } catch {
    // ignore and fall back
  }

  const fromApps = path.resolve(process.cwd(), "..", "..", relativePath);
  try {
    await fs.access(fromApps);
    return fromApps;
  } catch {
    // ignore and fall back
  }

  return direct;
}

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

      const payload = await resp.json();
      const widget = WidgetSchema.parse(unwrapWidgetPayload(payload));

      return {
        content: [
          {
            type: "text",
            text: `ID: ${widgetId}\nПревью виджета: ${localizedToText(widget.title) || widget.slug || ""}\nМодуль: ${module}`,
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

mcp.registerTool(
  "create-website-builder-widget",
  {
    title: "Create Website Builder Widget",
    description:
      "Создать seed-данные виджета website-builder в локальном репозитории.",
    inputSchema: {
      title: LocalizedTextSchema,
      subtitle: LocalizedTextSchema.optional(),
      description: LocalizedTextSchema.optional(),
      variant: z.string().optional(),
      slug: z.string().optional(),
      adminTitle: z.string().optional(),
      className: z.string().optional(),
      anchor: z.string().optional(),
    },
  },
  async (args) => {
    const parsed = WidgetSeedInputSchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: "text",
            text: `Неверный ввод: ${parsed.error.message}`,
          },
        ],
      };
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const slug = normalizeSlug(parsed.data.slug, id);

    const widgetData = {
      title: toLocalizedText(parsed.data.title),
      subtitle: toLocalizedText(parsed.data.subtitle),
      description: toLocalizedText(parsed.data.description),
      anchor: parsed.data.anchor ?? "",
      className: parsed.data.className ?? "",
      id,
      createdAt: now,
      updatedAt: now,
      variant: parsed.data.variant ?? "default",
      adminTitle: parsed.data.adminTitle ?? `Widget ${slug}`,
      slug,
    };

    const dataDir = await resolveRepoPath(
      "libs/modules/website-builder/models/widget/backend/repository/database/src/lib/data",
    );
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, `${id}.json`);
    await fs.writeFile(filePath, `${JSON.stringify(widgetData, null, 2)}\n`);

    return {
      content: [
        {
          type: "text",
          text: `Создан seed-файл виджета: ${filePath}\nID: ${id}\nSlug: ${slug}`,
        },
      ],
    };
  },
);
