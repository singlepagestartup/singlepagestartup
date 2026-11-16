/**
 * Given one signed-in session with two accessible profiles,
 * cart writes and warmed reads remain isolated by the selected profile.
 */
import { randomUUID } from "node:crypto";
import {
  createCartScenarioFixtures,
  type TCartScenarioFixtures,
} from "../issue-152/test-utils/fixtures";
import { expectOk, requestApi } from "../issue-152/test-utils/http";

const removals: Array<() => Promise<unknown>> = [];
let fixtures: TCartScenarioFixtures;
let subjectId: string;
let token: string;
let profileA: string;
let profileB: string;
const orderIds = new Set<string>();
async function create(path: string, data: Record<string, unknown>) {
  const response = await expectOk({
    method: "POST",
    path,
    data,
    includeSecret: true,
  });
  const id = response.payload.data.id as string;
  removals.unshift(() =>
    requestApi({
      method: "DELETE",
      path: path + "/" + id,
      includeSecret: true,
    }),
  );
  return id;
}
const cartPath = (profileId: string) =>
  `/api/rbac/subjects/${subjectId}/ecommerce-module/orders?socialModuleProfileId=${profileId}`;
async function list(profileId: string) {
  const response = await expectOk({
    method: "GET",
    path: cartPath(profileId) + "&includeCartDetails=true",
    token,
  });
  for (const order of response.payload.data) {
    orderIds.add(order.id);
  }
  return response.payload.data;
}
async function add(profileId: string, quantity: number) {
  return requestApi({
    method: "POST",
    path: cartPath(profileId),
    token,
    data: {
      productId: fixtures.productId,
      storeId: fixtures.storeId,
      quantity,
      billingModule: { currency: { id: fixtures.currencyId } },
    },
  });
}
beforeAll(async () => {
  fixtures = await createCartScenarioFixtures();
  const auth = await expectOk({
    method: "GET",
    path: "/api/rbac/subjects/authentication/init",
  });
  token = auth.payload.data.jwt;
  subjectId = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  ).subject.id;
  removals.push(() =>
    requestApi({
      method: "DELETE",
      path: "/api/rbac/subjects/" + subjectId,
      includeSecret: true,
    }),
  );
  const ensured = await expectOk({
    method: "POST",
    path: `/api/rbac/subjects/${subjectId}/social-module/profiles/ensure`,
    token,
    data: {},
  });
  profileA = ensured.payload.data.id;
  removals.unshift(() =>
    requestApi({
      method: "DELETE",
      path: "/api/social/profiles/" + profileA,
      includeSecret: true,
    }),
  );
  profileB = await create("/api/social/profiles", {
    slug: "scenario-407-" + randomUUID(),
    title: { en: "Second profile" },
  });
  await create("/api/rbac/subjects-to-social-module-profiles", {
    subjectId,
    socialModuleProfileId: profileB,
    variant: "assistant",
  });
});
afterAll(async () => {
  if (subjectId) {
    for (const profile of [profileA, profileB]) {
      if (profile) {
        try {
          await list(profile);
        } catch {}
      }
    }
  }
  for (const id of orderIds) {
    await requestApi({
      method: "DELETE",
      path: "/api/ecommerce/orders/" + id,
      includeSecret: true,
    });
  }
  for (const remove of removals) {
    await remove();
  }
  await fixtures?.cleanup();
});
it("keeps the same product independent across profiles and rejects cross-profile access", async () => {
  expect(await list(profileA)).toEqual([]);
  expect(await list(profileB)).toEqual([]);
  const competing = await Promise.all([
    add(profileA, 2),
    add(profileA, 2),
    add(profileA, 2),
  ]);
  expect(competing.map((r) => r.status).sort()).toEqual([200, 409, 409]);
  expect((await add(profileB, 5)).status).toBe(200);
  const [a] = await list(profileA);
  const [b] = await list(profileB);
  expect(a.id).not.toBe(b.id);
  expect(a.cartDetails.lines[0].quantity).toBe(2);
  expect(b.cartDetails.lines[0].quantity).toBe(5);
  const wrong = await requestApi({
    method: "DELETE",
    path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/${a.id}?socialModuleProfileId=${profileB}`,
    token,
  });
  expect(wrong.status).toBe(403);
  const update = await expectOk({
    method: "PATCH",
    path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/${a.id}?socialModuleProfileId=${profileA}`,
    token,
    data: {
      ordersToProducts: [{ id: a.cartDetails.lines[0].id, quantity: 3 }],
    },
  });
  expect(update.status).toBe(200);
  expect((await list(profileA))[0].cartDetails.lines[0].quantity).toBe(3);
  expect((await list(profileB))[0].cartDetails.lines[0].quantity).toBe(5);
});
