import type { Page, Request, Route } from "@playwright/test";

type TLocalizedText = {
  en: string;
  ru: string;
};

type TCurrency = {
  id: string;
  title: string;
  slug: string;
  symbol: string;
  variant: string;
  isDefault: boolean;
};

type TInvoice = {
  id: string;
  status: string;
  variant: string;
};

type TPaymentIntent = {
  id: string;
  amount: number;
  status: string;
  type: string;
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

type TPaymentIntentsToCurrencies = {
  id: string;
  paymentIntentId: string;
  currencyId: string;
  orderIndex: number;
  className: string;
  variant: string;
};

type TPaymentIntentsToInvoices = {
  id: string;
  paymentIntentId: string;
  invoiceId: string;
  orderIndex: number;
  className: string;
  variant: string;
};

export type TBillingMockState = {
  currencies: TCurrency[];
  invoices: TInvoice[];
  paymentIntents: TPaymentIntent[];
  widgets: TWidget[];
  paymentIntentsToCurrencies: TPaymentIntentsToCurrencies[];
  paymentIntentsToInvoices: TPaymentIntentsToInvoices[];
  createPaymentIntentCalls: number;
  deletePaymentIntentCalls: number;
  paymentIntentsToCurrenciesGetCalls: number;
  paymentIntentsToInvoicesGetCalls: number;
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

export async function setupBillingApiMocks(
  page: Page,
): Promise<TBillingMockState> {
  const state: TBillingMockState = {
    currencies: [
      {
        id: "c1111111-1111-1111-1111-111111111111",
        title: "US Dollar",
        slug: "usd",
        symbol: "$",
        variant: "default",
        isDefault: true,
      },
    ],
    invoices: [
      {
        id: "i1111111-1111-1111-1111-111111111111",
        status: "draft",
        variant: "default",
      },
    ],
    paymentIntents: [
      {
        id: "p1111111-1111-1111-1111-111111111111",
        amount: 1999,
        status: "requires_payment_method",
        type: "one_off",
        interval: "",
        variant: "default",
      },
    ],
    widgets: [
      {
        id: "w1111111-1111-1111-1111-111111111111",
        adminTitle: "Billing Widget",
        title: { en: "Billing Widget", ru: "Billing Widget" },
        subtitle: { en: "Widget subtitle", ru: "Widget subtitle" },
        description: { en: "Widget description", ru: "Widget description" },
        slug: "billing-widget",
        className: "",
        variant: "default",
      },
    ],
    paymentIntentsToCurrencies: [
      {
        id: "pc111111-1111-1111-1111-111111111111",
        paymentIntentId: "p1111111-1111-1111-1111-111111111111",
        currencyId: "c1111111-1111-1111-1111-111111111111",
        orderIndex: 0,
        className: "",
        variant: "default",
      },
    ],
    paymentIntentsToInvoices: [
      {
        id: "pi111111-1111-1111-1111-111111111111",
        paymentIntentId: "p1111111-1111-1111-1111-111111111111",
        invoiceId: "i1111111-1111-1111-1111-111111111111",
        orderIndex: 0,
        className: "",
        variant: "default",
      },
    ],
    createPaymentIntentCalls: 0,
    deletePaymentIntentCalls: 0,
    paymentIntentsToCurrenciesGetCalls: 0,
    paymentIntentsToInvoicesGetCalls: 0,
  };

  await page.route("**/api/billing/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/billing/currencies" && method === "GET") {
      return jsonResponse(route, 200, { data: state.currencies });
    }

    if (path === "/api/billing/invoices" && method === "GET") {
      return jsonResponse(route, 200, { data: state.invoices });
    }

    if (path === "/api/billing/payment-intents" && method === "GET") {
      return jsonResponse(route, 200, { data: state.paymentIntents });
    }

    if (path === "/api/billing/widgets" && method === "GET") {
      return jsonResponse(route, 200, { data: state.widgets });
    }

    if (
      path === "/api/billing/payment-intents-to-currencies" &&
      method === "GET"
    ) {
      state.paymentIntentsToCurrenciesGetCalls += 1;
      return jsonResponse(route, 200, {
        data: state.paymentIntentsToCurrencies,
      });
    }

    if (
      path === "/api/billing/payment-intents-to-invoices" &&
      method === "GET"
    ) {
      state.paymentIntentsToInvoicesGetCalls += 1;
      return jsonResponse(route, 200, { data: state.paymentIntentsToInvoices });
    }

    if (path === "/api/billing/payment-intents" && method === "POST") {
      state.createPaymentIntentCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);

      const created: TPaymentIntent = {
        id: `created-payment-intent-${state.createPaymentIntentCalls}`,
        amount: typeof data.amount === "number" ? data.amount : 0,
        status:
          typeof data.status === "string"
            ? data.status
            : "requires_payment_method",
        type: typeof data.type === "string" ? data.type : "one_off",
        interval: typeof data.interval === "string" ? data.interval : "",
        variant: typeof data.variant === "string" ? data.variant : "default",
      };

      state.paymentIntents.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (
      /^\/api\/billing\/payment-intents\/[^/]+$/.test(path) &&
      method === "DELETE"
    ) {
      state.deletePaymentIntentCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.paymentIntents = state.paymentIntents.filter(
        (item) => item.id !== id,
      );
      return jsonResponse(route, 200, { data: { id } });
    }

    const currencyById = withEntityGetById(
      state.currencies,
      path,
      /^\/api\/billing\/currencies\/[^/]+$/,
    );
    if (currencyById && method === "GET") {
      return jsonResponse(route, currencyById.status, currencyById.data);
    }

    const invoiceById = withEntityGetById(
      state.invoices,
      path,
      /^\/api\/billing\/invoices\/[^/]+$/,
    );
    if (invoiceById && method === "GET") {
      return jsonResponse(route, invoiceById.status, invoiceById.data);
    }

    const paymentIntentById = withEntityGetById(
      state.paymentIntents,
      path,
      /^\/api\/billing\/payment-intents\/[^/]+$/,
    );
    if (paymentIntentById && method === "GET") {
      return jsonResponse(
        route,
        paymentIntentById.status,
        paymentIntentById.data,
      );
    }

    const widgetById = withEntityGetById(
      state.widgets,
      path,
      /^\/api\/billing\/widgets\/[^/]+$/,
    );
    if (widgetById && method === "GET") {
      return jsonResponse(route, widgetById.status, widgetById.data);
    }

    const paymentIntentsToCurrenciesById = withEntityGetById(
      state.paymentIntentsToCurrencies,
      path,
      /^\/api\/billing\/payment-intents-to-currencies\/[^/]+$/,
    );
    if (paymentIntentsToCurrenciesById && method === "GET") {
      return jsonResponse(
        route,
        paymentIntentsToCurrenciesById.status,
        paymentIntentsToCurrenciesById.data,
      );
    }

    const paymentIntentsToInvoicesById = withEntityGetById(
      state.paymentIntentsToInvoices,
      path,
      /^\/api\/billing\/payment-intents-to-invoices\/[^/]+$/,
    );
    if (paymentIntentsToInvoicesById && method === "GET") {
      return jsonResponse(
        route,
        paymentIntentsToInvoicesById.status,
        paymentIntentsToInvoicesById.data,
      );
    }

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
