import type { Page, Route } from "@playwright/test";

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
};

function jsonResponse(
  route: Route,
  status: number,
  payload: unknown,
): Promise<void> {
  return route.fulfill({
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    },
    body: JSON.stringify(payload),
  });
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
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

    if (path === "/api/ecommerce/products-to-attributes" && method === "GET") {
      return jsonResponse(route, 200, { data: state.productsToAttributes });
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

    return jsonResponse(route, 200, { data: [] });
  });

  return state;
}
