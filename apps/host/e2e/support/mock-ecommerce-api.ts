import type { Page, Request, Route } from "@playwright/test";

type TLocalizedText = {
  en: string;
  ru: string;
};

type TProduct = {
  id: string;
  adminTitle: string;
  title: TLocalizedText;
  slug: string;
  variant: string;
  type: string;
  shortDescription: TLocalizedText;
  description: TLocalizedText;
};

type TAttribute = {
  id: string;
  adminTitle: string;
  slug: string;
  variant: string;
  string: TLocalizedText;
  number: number;
  boolean: boolean;
  datetime: string;
};

type TAttributeKey = {
  id: string;
  title: TLocalizedText;
  slug: string;
  variant: string;
  prefix: TLocalizedText;
  suffix: TLocalizedText;
  type: string;
  field: string;
};

type TCategory = {
  id: string;
  adminTitle: string;
  title: TLocalizedText;
  slug: string;
  variant: string;
  className: string;
  description: TLocalizedText;
};

type TOrder = {
  id: string;
  variant: string;
  status: string;
  type: string;
  comment: string;
};

type TStore = {
  id: string;
  adminTitle: string;
  title: TLocalizedText;
  slug: string;
  variant: string;
  shortDescription: TLocalizedText;
  description: TLocalizedText;
};

type TWidget = {
  id: string;
  adminTitle: string;
  title: TLocalizedText;
  slug: string;
  variant: string;
  className: string;
};

type TProductsToAttributes = {
  id: string;
  productId: string;
  attributeId: string;
  variant: string;
};

type TCategoriesToProducts = {
  id: string;
  categoryId: string;
  productId: string;
  variant: string;
};

type TOrdersToBillingModuleCurrencies = {
  id: string;
  orderId: string;
  billingModuleCurrencyId: string;
  variant: string;
};

type TBillingCurrency = {
  id: string;
  title: string;
  slug: string;
  symbol: string;
  variant: string;
  isDefault: boolean;
};

type TPaymentIntent = {
  id: string;
  amount: number;
  status: string;
  type: string;
  interval: string;
  variant: string;
};

type TFile = {
  id: string;
  adminTitle: string;
  slug: string;
  variant: string;
  file: string;
  className: string;
  containerClassName: string;
};

type TWebsiteBuilderWidget = {
  id: string;
  adminTitle: string;
  slug: string;
  variant: string;
  title: TLocalizedText;
  subtitle: TLocalizedText;
  description: TLocalizedText;
  anchor: string;
  className: string;
};

export type TEcommerceMockState = {
  products: TProduct[];
  attributes: TAttribute[];
  attributeKeys: TAttributeKey[];
  categories: TCategory[];
  orders: TOrder[];
  stores: TStore[];
  widgets: TWidget[];
  productsToAttributes: TProductsToAttributes[];
  categoriesToProducts: TCategoriesToProducts[];
  ordersToBillingModuleCurrencies: TOrdersToBillingModuleCurrencies[];
  billingCurrencies: TBillingCurrency[];
  paymentIntents: TPaymentIntent[];
  files: TFile[];
  websiteBuilderWidgets: TWebsiteBuilderWidget[];
  createProductCalls: number;
  deleteProductCalls: number;
  createAttributeCalls: number;
  deleteAttributeCalls: number;
  createProductsToAttributesCalls: number;
  deleteProductsToAttributesCalls: number;
  createAttributePayloads: Record<string, unknown>[];
  deleteAttributePayloads: Array<{ id: string }>;
  createProductsToAttributesPayloads: Record<string, unknown>[];
  deleteProductsToAttributesPayloads: Array<{ id: string }>;
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

export async function setupEcommerceApiMocks(
  page: Page,
): Promise<TEcommerceMockState> {
  const state: TEcommerceMockState = {
    products: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        adminTitle: "Mock Product Alpha",
        title: { en: "Mock Product Alpha", ru: "Mock Product Alpha" },
        slug: "mock-product-alpha",
        variant: "default",
        type: "one_off",
        shortDescription: {
          en: "Mock short description",
          ru: "Mock short description",
        },
        description: {
          en: "Mock description",
          ru: "Mock description",
        },
      },
    ],
    attributes: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        adminTitle: "Mock Attribute Color",
        slug: "mock-attribute-color",
        variant: "default",
        string: { en: "Blue", ru: "Blue" },
        number: 42,
        boolean: true,
        datetime: "2026-01-01T00:00:00.000Z",
      },
    ],
    attributeKeys: [
      {
        id: "66666666-6666-6666-6666-666666666666",
        title: { en: "Color", ru: "Color" },
        slug: "color",
        variant: "default",
        prefix: { en: "", ru: "" },
        suffix: { en: "", ru: "" },
        type: "string",
        field: "string",
      },
    ],
    categories: [
      {
        id: "77777777-7777-7777-7777-777777777777",
        adminTitle: "Mock Category Main",
        title: { en: "Main", ru: "Main" },
        slug: "main-category",
        variant: "default",
        className: "mock-category",
        description: { en: "Category", ru: "Category" },
      },
    ],
    orders: [
      {
        id: "88888888-8888-8888-8888-888888888888",
        variant: "default",
        status: "new",
        type: "cart",
        comment: "Mock order",
      },
    ],
    stores: [
      {
        id: "99999999-9999-9999-9999-999999999999",
        adminTitle: "Mock Store",
        title: { en: "Mock Store", ru: "Mock Store" },
        slug: "mock-store",
        variant: "default",
        shortDescription: { en: "Short", ru: "Short" },
        description: { en: "Description", ru: "Description" },
      },
    ],
    widgets: [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        adminTitle: "Mock Widget",
        title: { en: "Widget", ru: "Widget" },
        slug: "mock-widget",
        variant: "default",
        className: "mock-widget",
      },
    ],
    productsToAttributes: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        productId: "11111111-1111-1111-1111-111111111111",
        attributeId: "22222222-2222-2222-2222-222222222222",
        variant: "default",
      },
    ],
    categoriesToProducts: [
      {
        id: "44444444-4444-4444-4444-444444444444",
        categoryId: "77777777-7777-7777-7777-777777777777",
        productId: "11111111-1111-1111-1111-111111111111",
        variant: "default",
      },
    ],
    ordersToBillingModuleCurrencies: [
      {
        id: "55555555-5555-5555-5555-555555555555",
        orderId: "88888888-8888-8888-8888-888888888888",
        billingModuleCurrencyId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        variant: "default",
      },
    ],
    billingCurrencies: [
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        title: "USD",
        slug: "usd",
        symbol: "$",
        variant: "default",
        isDefault: true,
      },
    ],
    paymentIntents: [
      {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        amount: 100,
        status: "requires_payment_method",
        type: "one_off",
        interval: "month",
        variant: "default",
      },
    ],
    files: [
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        adminTitle: "Mock File",
        slug: "mock-file",
        variant: "default",
        file: "/mock-file.png",
        className: "",
        containerClassName: "",
      },
    ],
    websiteBuilderWidgets: [
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        adminTitle: "Mock Website Widget",
        slug: "mock-website-widget",
        variant: "default",
        title: { en: "Website Widget", ru: "Website Widget" },
        subtitle: { en: "", ru: "" },
        description: { en: "", ru: "" },
        anchor: "",
        className: "",
      },
    ],
    createProductCalls: 0,
    deleteProductCalls: 0,
    createAttributeCalls: 0,
    deleteAttributeCalls: 0,
    createProductsToAttributesCalls: 0,
    deleteProductsToAttributesCalls: 0,
    createAttributePayloads: [],
    deleteAttributePayloads: [],
    createProductsToAttributesPayloads: [],
    deleteProductsToAttributesPayloads: [],
  };

  await page.route("**/api/ecommerce/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/ecommerce/products" && method === "GET") {
      return jsonResponse(route, 200, { data: state.products });
    }

    if (path === "/api/ecommerce/products" && method === "POST") {
      state.createProductCalls += 1;

      const created: TProduct = {
        id: `created-product-${state.createProductCalls}`,
        adminTitle: `Created Product ${state.createProductCalls}`,
        title: {
          en: `Created Product ${state.createProductCalls}`,
          ru: `Created Product ${state.createProductCalls}`,
        },
        slug: `created-product-${state.createProductCalls}`,
        variant: "default",
        type: "one_off",
        shortDescription: { en: "", ru: "" },
        description: { en: "", ru: "" },
      };

      state.products.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (
      /^\/api\/ecommerce\/products\/[^/]+$/.test(path) &&
      method === "DELETE"
    ) {
      state.deleteProductCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.products = state.products.filter((item) => item.id !== id);
      return jsonResponse(route, 200, { data: { id } });
    }

    if (path === "/api/ecommerce/attributes" && method === "GET") {
      return jsonResponse(route, 200, { data: state.attributes });
    }

    if (path === "/api/ecommerce/attributes" && method === "POST") {
      state.createAttributeCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);
      state.createAttributePayloads.push(data);

      const created: TAttribute = {
        id: `created-attribute-${state.createAttributeCalls}`,
        adminTitle:
          typeof data.adminTitle === "string"
            ? data.adminTitle
            : `Created Attribute ${state.createAttributeCalls}`,
        slug:
          typeof data.slug === "string"
            ? data.slug
            : `created-attribute-${state.createAttributeCalls}`,
        variant: typeof data.variant === "string" ? data.variant : "default",
        string:
          data.string && typeof data.string === "object"
            ? (data.string as TLocalizedText)
            : { en: "", ru: "" },
        number: typeof data.number === "number" ? data.number : 0,
        boolean: typeof data.boolean === "boolean" ? data.boolean : false,
        datetime:
          typeof data.datetime === "string"
            ? data.datetime
            : "2026-01-01T00:00:00.000Z",
      };

      state.attributes.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (
      /^\/api\/ecommerce\/attributes\/[^/]+$/.test(path) &&
      method === "DELETE"
    ) {
      state.deleteAttributeCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.deleteAttributePayloads.push({ id });

      state.attributes = state.attributes.filter((item) => item.id !== id);
      state.productsToAttributes = state.productsToAttributes.filter(
        (item) => item.attributeId !== id,
      );

      return jsonResponse(route, 200, { data: { id } });
    }

    if (path === "/api/ecommerce/attribute-keys" && method === "GET") {
      return jsonResponse(route, 200, { data: state.attributeKeys });
    }

    if (path === "/api/ecommerce/categories" && method === "GET") {
      return jsonResponse(route, 200, { data: state.categories });
    }

    if (path === "/api/ecommerce/orders" && method === "GET") {
      return jsonResponse(route, 200, { data: state.orders });
    }

    if (path === "/api/ecommerce/stores" && method === "GET") {
      return jsonResponse(route, 200, { data: state.stores });
    }

    if (path === "/api/ecommerce/widgets" && method === "GET") {
      return jsonResponse(route, 200, { data: state.widgets });
    }

    if (path === "/api/ecommerce/products-to-attributes" && method === "GET") {
      return jsonResponse(route, 200, { data: state.productsToAttributes });
    }

    if (path === "/api/ecommerce/products-to-attributes" && method === "POST") {
      state.createProductsToAttributesCalls += 1;

      const payload = parseRequestPayload(request);
      const data = extractDataPayload(payload);
      state.createProductsToAttributesPayloads.push(data);

      const created: TProductsToAttributes = {
        id: `created-products-to-attributes-${state.createProductsToAttributesCalls}`,
        productId:
          typeof data.productId === "string"
            ? data.productId
            : state.products[0]?.id || "",
        attributeId:
          typeof data.attributeId === "string"
            ? data.attributeId
            : state.attributes[0]?.id || "",
        variant: typeof data.variant === "string" ? data.variant : "default",
      };

      state.productsToAttributes.push(created);

      return jsonResponse(route, 200, { data: created });
    }

    if (
      /^\/api\/ecommerce\/products-to-attributes\/[^/]+$/.test(path) &&
      method === "DELETE"
    ) {
      state.deleteProductsToAttributesCalls += 1;
      const id = path.split("/").at(-1) || "";
      state.deleteProductsToAttributesPayloads.push({ id });

      state.productsToAttributes = state.productsToAttributes.filter(
        (item) => item.id !== id,
      );

      return jsonResponse(route, 200, { data: { id } });
    }

    if (path === "/api/ecommerce/categories-to-products" && method === "GET") {
      return jsonResponse(route, 200, { data: state.categoriesToProducts });
    }

    if (
      path === "/api/ecommerce/orders-to-billing-module-currencies" &&
      method === "GET"
    ) {
      return jsonResponse(route, 200, {
        data: state.ordersToBillingModuleCurrencies,
      });
    }

    const productsById = withEntityGetById(
      state.products,
      path,
      /^\/api\/ecommerce\/products\/[^/]+$/,
    );
    if (productsById && method === "GET") {
      return jsonResponse(route, productsById.status, productsById.data);
    }

    const attributesById = withEntityGetById(
      state.attributes,
      path,
      /^\/api\/ecommerce\/attributes\/[^/]+$/,
    );
    if (attributesById && method === "GET") {
      return jsonResponse(route, attributesById.status, attributesById.data);
    }

    const attributeKeysById = withEntityGetById(
      state.attributeKeys,
      path,
      /^\/api\/ecommerce\/attribute-keys\/[^/]+$/,
    );
    if (attributeKeysById && method === "GET") {
      return jsonResponse(
        route,
        attributeKeysById.status,
        attributeKeysById.data,
      );
    }

    const categoriesById = withEntityGetById(
      state.categories,
      path,
      /^\/api\/ecommerce\/categories\/[^/]+$/,
    );
    if (categoriesById && method === "GET") {
      return jsonResponse(route, categoriesById.status, categoriesById.data);
    }

    const ordersById = withEntityGetById(
      state.orders,
      path,
      /^\/api\/ecommerce\/orders\/[^/]+$/,
    );
    if (ordersById && method === "GET") {
      return jsonResponse(route, ordersById.status, ordersById.data);
    }

    const storesById = withEntityGetById(
      state.stores,
      path,
      /^\/api\/ecommerce\/stores\/[^/]+$/,
    );
    if (storesById && method === "GET") {
      return jsonResponse(route, storesById.status, storesById.data);
    }

    const widgetsById = withEntityGetById(
      state.widgets,
      path,
      /^\/api\/ecommerce\/widgets\/[^/]+$/,
    );
    if (widgetsById && method === "GET") {
      return jsonResponse(route, widgetsById.status, widgetsById.data);
    }

    const productsToAttributesById = withEntityGetById(
      state.productsToAttributes,
      path,
      /^\/api\/ecommerce\/products-to-attributes\/[^/]+$/,
    );
    if (productsToAttributesById && method === "GET") {
      return jsonResponse(
        route,
        productsToAttributesById.status,
        productsToAttributesById.data,
      );
    }

    const categoriesToProductsById = withEntityGetById(
      state.categoriesToProducts,
      path,
      /^\/api\/ecommerce\/categories-to-products\/[^/]+$/,
    );
    if (categoriesToProductsById && method === "GET") {
      return jsonResponse(
        route,
        categoriesToProductsById.status,
        categoriesToProductsById.data,
      );
    }

    const ordersToBillingCurrenciesById = withEntityGetById(
      state.ordersToBillingModuleCurrencies,
      path,
      /^\/api\/ecommerce\/orders-to-billing-module-currencies\/[^/]+$/,
    );
    if (ordersToBillingCurrenciesById && method === "GET") {
      return jsonResponse(
        route,
        ordersToBillingCurrenciesById.status,
        ordersToBillingCurrenciesById.data,
      );
    }

    return jsonResponse(route, 200, { data: [] });
  });

  await page.route("**/api/billing/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/billing/currencies" && method === "GET") {
      return jsonResponse(route, 200, { data: state.billingCurrencies });
    }

    if (path === "/api/billing/payment-intents" && method === "GET") {
      return jsonResponse(route, 200, { data: state.paymentIntents });
    }

    const currencyById = withEntityGetById(
      state.billingCurrencies,
      path,
      /^\/api\/billing\/currencies\/[^/]+$/,
    );
    if (currencyById && method === "GET") {
      return jsonResponse(route, currencyById.status, currencyById.data);
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

    return jsonResponse(route, 200, { data: [] });
  });

  await page.route("**/api/file-storage/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/file-storage/files" && method === "GET") {
      return jsonResponse(route, 200, { data: state.files });
    }

    const fileById = withEntityGetById(
      state.files,
      path,
      /^\/api\/file-storage\/files\/[^/]+$/,
    );
    if (fileById && method === "GET") {
      return jsonResponse(route, fileById.status, fileById.data);
    }

    return jsonResponse(route, 200, { data: [] });
  });

  await page.route("**/api/website-builder/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (method === "OPTIONS") {
      return jsonResponse(route, 204, {});
    }

    if (path === "/api/website-builder/widgets" && method === "GET") {
      return jsonResponse(route, 200, { data: state.websiteBuilderWidgets });
    }

    const widgetById = withEntityGetById(
      state.websiteBuilderWidgets,
      path,
      /^\/api\/website-builder\/widgets\/[^/]+$/,
    );
    if (widgetById && method === "GET") {
      return jsonResponse(route, widgetById.status, widgetById.data);
    }

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
