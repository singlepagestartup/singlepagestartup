import type { Page, Request, Route } from "@playwright/test";

type TLocalizedText = {
  en: string;
  ru: string;
};

type TAgent = {
  id: string;
  title: string;
  adminTitle: string;
  slug: string;
  interval: string;
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

export type TAgentMockState = {
  agents: TAgent[];
  widgets: TWidget[];
  createAgentCalls: number;
  deleteAgentCalls: number;
  createWidgetCalls: number;
  deleteWidgetCalls: number;
  createAgentPayloads: Record<string, unknown>[];
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

export async function setupAgentApiMocks(page: Page): Promise<TAgentMockState> {
  const state: TAgentMockState = {
    agents: [
      {
        id: "a1111111-1111-1111-1111-111111111111",
        title: "Agent health check",
        adminTitle: "Mock Agent Health Check",
        slug: "mock-agent-health-check",
        interval: "*/5 * * * *",
        variant: "default",
      },
    ],
    widgets: [
      {
        id: "b2222222-2222-2222-2222-222222222222",
        adminTitle: "Mock Agent Widget",
        title: {
          en: "Mock Agent Widget",
          ru: "Mock Agent Widget",
        },
        subtitle: {
          en: "Widget subtitle",
          ru: "Widget subtitle",
        },
        description: {
          en: "Widget description",
          ru: "Widget description",
        },
        slug: "mock-agent-widget",
        className: "",
        variant: "default",
      },
    ],
    createAgentCalls: 0,
    deleteAgentCalls: 0,
    createWidgetCalls: 0,
    deleteWidgetCalls: 0,
    createAgentPayloads: [],
    createWidgetPayloads: [],
  };

  await page.route("**/api/agent/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/agent/agents" && method === "GET") {
      return jsonResponse(route, 200, { data: state.agents });
    }

    if (path === "/api/agent/agents" && method === "POST") {
      state.createAgentCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);
      state.createAgentPayloads.push(data);

      const created: TAgent = {
        id: `created-agent-${state.createAgentCalls}`,
        title:
          typeof data.title === "string"
            ? data.title
            : `Created Agent ${state.createAgentCalls}`,
        adminTitle:
          typeof data.adminTitle === "string"
            ? data.adminTitle
            : `Created Agent ${state.createAgentCalls}`,
        slug:
          typeof data.slug === "string"
            ? data.slug
            : `created-agent-${state.createAgentCalls}`,
        interval:
          typeof data.interval === "string" ? data.interval : "*/5 * * * *",
        variant: typeof data.variant === "string" ? data.variant : "default",
      };

      state.agents.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (/^\/api\/agent\/agents\/[^/]+$/.test(path) && method === "DELETE") {
      state.deleteAgentCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.agents = state.agents.filter((item) => item.id !== id);
      return jsonResponse(route, 200, { data: { id } });
    }

    if (path === "/api/agent/widgets" && method === "GET") {
      return jsonResponse(route, 200, { data: state.widgets });
    }

    if (path === "/api/agent/widgets" && method === "POST") {
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

    if (/^\/api\/agent\/widgets\/[^/]+$/.test(path) && method === "DELETE") {
      state.deleteWidgetCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.widgets = state.widgets.filter((item) => item.id !== id);
      return jsonResponse(route, 200, { data: { id } });
    }

    const agentById = withEntityGetById(
      state.agents,
      path,
      /^\/api\/agent\/agents\/[^/]+$/,
    );
    if (agentById && method === "GET") {
      return jsonResponse(route, agentById.status, agentById.data);
    }

    const widgetById = withEntityGetById(
      state.widgets,
      path,
      /^\/api\/agent\/widgets\/[^/]+$/,
    );
    if (widgetById && method === "GET") {
      return jsonResponse(route, widgetById.status, widgetById.data);
    }

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
