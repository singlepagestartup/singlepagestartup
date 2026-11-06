/**
 * BDD Scenario: concurrent duplicate cart requests through the complete API.
 *
 * Given: an isolated anonymous Subject and a priced Product in PostgreSQL.
 * When: concurrent add requests arrive, then the accepted Order moves to history.
 * Then: exactly one open cart is created, rejected requests write nothing, and a repeat purchase succeeds.
 */
import qs from "qs";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { getCartStateFromDb } from "../issue-152/test-utils/db";
import {
  createCartScenarioFixtures,
  type TCartScenarioFixtures,
} from "../issue-152/test-utils/fixtures";
import { expectOk, requestApi } from "../issue-152/test-utils/http";

let fixtures: TCartScenarioFixtures | undefined;
let subjectId: string | undefined;
let token: string | undefined;

afterAll(async () => {
  try {
    if (fixtures) {
      const lines = await expectOk({
        method: "GET",
        path:
          "/api/ecommerce/orders-to-products?" +
          qs.stringify({
            filters: {
              and: [
                {
                  column: "productId",
                  method: "eq",
                  value: fixtures.productId,
                },
              ],
            },
          }),
        includeSecret: true,
      });
      const ids = new Set<string>(
        lines.payload.data.map((line: { orderId: string }) => line.orderId),
      );
      for (const id of ids)
        await expectOk({
          method: "DELETE",
          path: `/api/ecommerce/orders/${id}`,
          includeSecret: true,
        });
    }
    if (subjectId)
      await expectOk({
        method: "DELETE",
        path: `/api/rbac/subjects/${subjectId}`,
        includeSecret: true,
      });
    await fixtures?.cleanup();
  } finally {
    await getPostgresClient().end();
  }
});

it("rejects competing adds with 409, keeps warmed cart reads fresh, and allows a history repeat", async () => {
  fixtures = await createCartScenarioFixtures();
  const auth = await expectOk({
    method: "GET",
    path: "/api/rbac/subjects/authentication/init",
  });
  token = auth.payload.data.jwt;
  if (!token) throw new Error("Anonymous initialization returned no JWT");
  subjectId = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  ).subject.id;
  if (!subjectId) throw new Error("Anonymous JWT has no Subject");
  const path = `/api/rbac/subjects/${subjectId}/ecommerce-module/orders`;
  const list = () =>
    expectOk({ method: "GET", path: path + "?includeCartDetails=true", token });
  expect((await list()).payload.data).toHaveLength(0);
  const add = () =>
    requestApi({
      method: "POST",
      path,
      token,
      data: {
        productId: fixtures!.productId,
        storeId: fixtures!.storeId,
        quantity: 3,
        billingModule: { currency: { id: fixtures!.currencyId } },
      },
    });
  const results = await Promise.all([add(), add(), add(), add()]);
  expect(results.map((result) => result.status).sort()).toEqual([
    200, 409, 409, 409,
  ]);
  for (const result of results.filter((result) => result.status === 409))
    expect(result.payload.error).toContain(
      "Conflict error. Product is already in the cart",
    );
  const state = await getCartStateFromDb({
    subjectId,
    productId: fixtures.productId,
  });
  expect(state.cartOrders).toHaveLength(1);
  expect(state.ordersToProducts).toHaveLength(1);
  expect(state.ordersToProducts[0].quantity).toBe(3);
  const [order] = (await list()).payload.data;
  expect(order.cartDetails.lines).toHaveLength(1);
  expect(order.cartDetails.lines[0].quantity).toBe(3);
  await expectOk({
    method: "PATCH",
    path: `/api/ecommerce/orders/${order.id}`,
    includeSecret: true,
    data: { type: "history" },
  });
  expect((await list()).payload.data).toHaveLength(0);
  expect((await add()).status).toBe(200);
  expect((await list()).payload.data).toHaveLength(1);
});
