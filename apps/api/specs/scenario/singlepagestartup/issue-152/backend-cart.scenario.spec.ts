/**
 * BDD Suite: issue-152 backend cart behavior with real API and database.
 *
 * Given: API server, database, and fixed RBAC test subject are running from apps/api/.env.
 * When: subject adds a product to cart and requests list/quantity endpoints.
 * Then: order + orders-to-products are persisted in DB, list returns cart orders, and quantity returns summed amount.
 */

import { Provider as KvProvider } from "@sps/providers-kv";
import { authenticateScenarioSubject } from "./test-utils/auth";
import { getCartStateFromDb } from "./test-utils/db";
import { getApiUrl, loadScenarioEnv } from "./test-utils/env";
import {
  clearSubjectCartOrders,
  createCartOrder,
  createCartScenarioFixtures,
  getCartOrders,
  getCartOrdersRaw,
  getCartQuantity,
  getCartQuantityRaw,
  type TCartScenarioFixtures,
} from "./test-utils/fixtures";
import { expectOk, requestApi } from "./test-utils/http";
import { waitForCondition } from "./test-utils/polling";

const HTTP_CACHE_DATA_PREFIX = "http-cache:data";
const HTTP_CACHE_VERSION_PREFIX = "http-cache:version";

function getKvProviderType(): "redis" | "vercel-kv" {
  loadScenarioEnv();
  return process.env["KV_PROVIDER"] === "redis" ? "redis" : "vercel-kv";
}

async function clearHttpCache() {
  const response = await requestApi({
    method: "GET",
    path: "/api/http-cache/clear",
  });

  if (response.status !== 200) {
    throw new Error(
      `HTTP cache clear route must return 200. Got ${response.status}: ${JSON.stringify(response.payload)}`,
    );
  }
}

async function getCacheVersion(provider: KvProvider, path: string) {
  const rawVersion = await provider.get({
    prefix: HTTP_CACHE_VERSION_PREFIX,
    key: path,
  });

  if (!rawVersion) {
    return 0;
  }

  const parsedVersion = Number(rawVersion);
  return Number.isFinite(parsedVersion) && parsedVersion >= 0
    ? parsedVersion
    : 0;
}

async function hasCachedResponseForPath(
  provider: KvProvider,
  path: string,
  params = "",
) {
  const version = await getCacheVersion(provider, path);
  const cached = await provider.get({
    prefix: `${HTTP_CACHE_DATA_PREFIX}:${path}:v${version}`,
    key: params,
  });

  return Boolean(cached);
}

describe("Given: issue-152 backend cart scenario", () => {
  let subjectId = "";
  let jwt = "";
  let fixtures: TCartScenarioFixtures | null = null;
  const kvProvider = new KvProvider({
    type: getKvProviderType(),
  });

  beforeAll(async () => {
    const auth = await authenticateScenarioSubject();
    subjectId = auth.id;
    jwt = auth.jwt;
    fixtures = await createCartScenarioFixtures();
  });

  beforeEach(async () => {
    await clearSubjectCartOrders({ subjectId, jwt });
  });

  afterAll(async () => {
    await clearSubjectCartOrders({ subjectId, jwt });
    await fixtures?.cleanup();
  });

  it("When: Add to cart is called without existing new cart order Then: DB contains new cart order and orders-to-products relation", async () => {
    if (!fixtures) {
      throw new Error("Fixtures were not initialized");
    }

    const quantity = 2;

    await createCartOrder({
      subjectId,
      jwt,
      productId: fixtures.productId,
      storeId: fixtures.storeId,
      currencyId: fixtures.currencyId,
      quantity,
    });

    const dbState = await getCartStateFromDb({
      subjectId,
      productId: fixtures.productId,
    });

    expect(dbState.cartOrders.length).toBeGreaterThan(0);
    expect(dbState.ordersToProducts.length).toBeGreaterThan(0);
    expect(dbState.ordersToProducts[0]?.quantity).toBe(quantity);
  });

  it("When: subject has new cart order Then: list returns cart orders and quantity endpoint returns sum", async () => {
    if (!fixtures) {
      throw new Error("Fixtures were not initialized");
    }

    const quantity = 3;

    await createCartOrder({
      subjectId,
      jwt,
      productId: fixtures.productId,
      storeId: fixtures.storeId,
      currencyId: fixtures.currencyId,
      quantity,
    });

    const orders = await getCartOrders({
      subjectId,
      jwt,
    });

    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]?.type).toBe("cart");

    await waitForCondition(async () => {
      const summedQuantity = await getCartQuantity({
        subjectId,
        jwt,
      });

      return summedQuantity === quantity;
    });
  });

  it("When: quantity is requested before and after add-to-cart Then: endpoint returns fresh quantity without cache-bust params", async () => {
    if (!fixtures) {
      throw new Error("Fixtures were not initialized");
    }

    await clearHttpCache();

    const beforeQuantity = await getCartQuantityRaw({
      subjectId,
      jwt,
    });
    expect(beforeQuantity).toBe(0);

    await createCartOrder({
      subjectId,
      jwt,
      productId: fixtures.productId,
      storeId: fixtures.storeId,
      currencyId: fixtures.currencyId,
      quantity: 1,
    });

    await waitForCondition(async () => {
      const afterQuantity = await getCartQuantityRaw({
        subjectId,
        jwt,
      });

      return afterQuantity === 1;
    });
  });

  it("When: cache middleware is enabled Then: /orders is cached but /orders/quantity and /orders/total are excluded", async () => {
    await clearHttpCache();

    const apiUrl = getApiUrl();
    const ordersPath = `${apiUrl}/api/rbac/subjects/${subjectId}/ecommerce-module/orders`;
    const quantityPath = `${apiUrl}/api/rbac/subjects/${subjectId}/ecommerce-module/orders/quantity`;
    const totalPath = `${apiUrl}/api/rbac/subjects/${subjectId}/ecommerce-module/orders/total`;

    await getCartOrdersRaw({
      subjectId,
      jwt,
    });
    await getCartQuantityRaw({
      subjectId,
      jwt,
    });
    await expectOk({
      method: "GET",
      path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/total`,
      token: jwt,
    });

    await waitForCondition(async () => {
      return hasCachedResponseForPath(kvProvider, ordersPath, "");
    });

    const hasQuantityCache = await hasCachedResponseForPath(
      kvProvider,
      quantityPath,
      "",
    );
    const hasTotalCache = await hasCachedResponseForPath(
      kvProvider,
      totalPath,
      "",
    );

    expect(hasQuantityCache).toBe(false);
    expect(hasTotalCache).toBe(false);
  });
});
