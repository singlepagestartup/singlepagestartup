import type { Page, Request, Route } from "@playwright/test";

type TProduct = {
  id: string;
  adminTitle: string;
  title: { en: string; ru: string };
  slug: string;
  variant: string;
  type: string;
  shortDescription: { en: string; ru: string };
  description: { en: string; ru: string };
};

type TAttribute = {
  id: string;
  adminTitle: string;
  slug: string;
  variant: string;
  string: { en: string; ru: string };
  number: number;
  boolean: boolean;
  datetime: string;
};

type TProductsToAttributes = {
  id: string;
  productId: string;
  attributeId: string;
  variant: string;
};

export type TEcommerceMockState = {
  products: TProduct[];
  attributes: TAttribute[];
  productsToAttributes: TProductsToAttributes[];
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
    productsToAttributes: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        productId: "11111111-1111-1111-1111-111111111111",
        attributeId: "22222222-2222-2222-2222-222222222222",
        variant: "default",
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

    if (/^\/api\/ecommerce\/products\/[^/]+$/.test(path) && method === "GET") {
      const id = path.split("/").at(-1) || "";
      const found = state.products.find((item) => item.id === id);

      if (!found) {
        return jsonResponse(route, 404, { error: "Not found" });
      }

      return jsonResponse(route, 200, { data: found });
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
            ? (data.string as { en: string; ru: string })
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
      method === "GET"
    ) {
      const id = path.split("/").at(-1) || "";
      const found = state.attributes.find((item) => item.id === id);

      if (!found) {
        return jsonResponse(route, 404, { error: "Not found" });
      }

      return jsonResponse(route, 200, { data: found });
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
      method === "GET"
    ) {
      const id = path.split("/").at(-1) || "";
      const found = state.productsToAttributes.find((item) => item.id === id);

      if (!found) {
        return jsonResponse(route, 404, { error: "Not found" });
      }

      return jsonResponse(route, 200, { data: found });
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

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
