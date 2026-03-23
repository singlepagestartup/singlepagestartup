import type { Page, Request, Route } from "@playwright/test";

type TLocalizedText = {
  en: string;
  ru: string;
};

type TMetric = {
  id: string;
  title: string;
  value: number;
  variant: string;
};

type TWidget = {
  id: string;
  adminTitle: string;
  title: TLocalizedText;
  subtitle: TLocalizedText;
  description: TLocalizedText;
  slug: string;
  className: string;
  variant: string;
};

export type TAnalyticMockState = {
  metrics: TMetric[];
  widgets: TWidget[];
  createMetricCalls: number;
  deleteMetricCalls: number;
  createWidgetCalls: number;
  deleteWidgetCalls: number;
  createMetricPayloads: Record<string, unknown>[];
  createWidgetPayloads: Record<string, unknown>[];
};

function jsonResponse(
  route: Route,
  status: number,
  payload: unknown,
): Promise<void> {
  const request = route.request();
  const requestHeaders = request.headers();
  const origin =
    requestHeaders["origin"] ||
    requestHeaders["referer"]?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const requestedHeaders =
    requestHeaders["access-control-request-headers"] ||
    "authorization,content-type,cache-control";

  return route.fulfill({
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": requestedHeaders,
      vary: "Origin",
    },
    body: JSON.stringify(payload),
  });
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function parseMultipartFormData(postData: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const fieldRegex = /name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n/g;
  let match: RegExpExecArray | null = fieldRegex.exec(postData);

  while (match) {
    const fieldName = match[1];
    const rawValue = match[2];

    try {
      payload[fieldName] = JSON.parse(rawValue);
    } catch {
      payload[fieldName] = rawValue;
    }

    match = fieldRegex.exec(postData);
  }

  return payload;
}

function parseRequestPayload(request: Request): Record<string, unknown> {
  const postData = request.postData();

  if (!postData) {
    return {};
  }

  try {
    const parsed = JSON.parse(postData);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {}

  return parseMultipartFormData(postData);
}

function extractDataPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const data = payload.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return payload;
}

function withEntityGetById<T extends { id: string }>(
  collection: T[],
  path: string,
  pattern: RegExp,
) {
  if (!pattern.test(path)) {
    return null;
  }

  const id = path.split("/").at(-1) || "";
  const found = collection.find((item) => item.id === id);

  if (!found) {
    return { status: 404, data: { error: "Not found" } };
  }

  return { status: 200, data: { data: found } };
}

export async function setupAnalyticApiMocks(
  page: Page,
): Promise<TAnalyticMockState> {
  const state: TAnalyticMockState = {
    metrics: [
      {
        id: "c3333333-3333-3333-3333-333333333333",
        title: "Monthly active users",
        value: 1240,
        variant: "default",
      },
    ],
    widgets: [
      {
        id: "d4444444-4444-4444-4444-444444444444",
        adminTitle: "Analytic widget",
        title: {
          en: "Analytic widget",
          ru: "Analytic widget",
        },
        subtitle: {
          en: "Widget subtitle",
          ru: "Widget subtitle",
        },
        description: {
          en: "Widget description",
          ru: "Widget description",
        },
        slug: "analytic-widget",
        className: "",
        variant: "default",
      },
    ],
    createMetricCalls: 0,
    deleteMetricCalls: 0,
    createWidgetCalls: 0,
    deleteWidgetCalls: 0,
    createMetricPayloads: [],
    createWidgetPayloads: [],
  };

  await page.route("**/api/analytic/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/analytic/metrics" && method === "GET") {
      return jsonResponse(route, 200, { data: state.metrics });
    }

    if (path === "/api/analytic/metrics" && method === "POST") {
      state.createMetricCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);
      state.createMetricPayloads.push(data);

      const created: TMetric = {
        id: `created-metric-${state.createMetricCalls}`,
        title:
          typeof data.title === "string"
            ? data.title
            : `Created Metric ${state.createMetricCalls}`,
        value: typeof data.value === "number" ? data.value : 0,
        variant: typeof data.variant === "string" ? data.variant : "default",
      };

      state.metrics.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (/^\/api\/analytic\/metrics\/[^/]+$/.test(path) && method === "DELETE") {
      state.deleteMetricCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.metrics = state.metrics.filter((item) => item.id !== id);
      return jsonResponse(route, 200, { data: { id } });
    }

    if (path === "/api/analytic/widgets" && method === "GET") {
      return jsonResponse(route, 200, { data: state.widgets });
    }

    if (path === "/api/analytic/widgets" && method === "POST") {
      state.createWidgetCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);
      state.createWidgetPayloads.push(data);

      const created: TWidget = {
        id: `created-widget-${state.createWidgetCalls}`,
        adminTitle:
          typeof data.adminTitle === "string"
            ? data.adminTitle
            : `Created Widget ${state.createWidgetCalls}`,
        title:
          data.title && typeof data.title === "object"
            ? (data.title as TLocalizedText)
            : { en: "", ru: "" },
        subtitle:
          data.subtitle && typeof data.subtitle === "object"
            ? (data.subtitle as TLocalizedText)
            : { en: "", ru: "" },
        description:
          data.description && typeof data.description === "object"
            ? (data.description as TLocalizedText)
            : { en: "", ru: "" },
        slug:
          typeof data.slug === "string"
            ? data.slug
            : `created-widget-${state.createWidgetCalls}`,
        className: typeof data.className === "string" ? data.className : "",
        variant: typeof data.variant === "string" ? data.variant : "default",
      };

      state.widgets.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (/^\/api\/analytic\/widgets\/[^/]+$/.test(path) && method === "DELETE") {
      state.deleteWidgetCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.widgets = state.widgets.filter((item) => item.id !== id);
      return jsonResponse(route, 200, { data: { id } });
    }

    const metricById = withEntityGetById(
      state.metrics,
      path,
      /^\/api\/analytic\/metrics\/[^/]+$/,
    );
    if (metricById && method === "GET") {
      return jsonResponse(route, metricById.status, metricById.data);
    }

    const widgetById = withEntityGetById(
      state.widgets,
      path,
      /^\/api\/analytic\/widgets\/[^/]+$/,
    );
    if (widgetById && method === "GET") {
      return jsonResponse(route, widgetById.status, widgetById.data);
    }

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
