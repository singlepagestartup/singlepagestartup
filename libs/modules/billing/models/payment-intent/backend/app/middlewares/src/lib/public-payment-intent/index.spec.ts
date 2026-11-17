import { Hono, type Context } from "hono";
import qs from "qs";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { applyOutputSchema } from "@sps/shared-backend-api";
import {
  outputSchema,
  privateCheckoutFields,
} from "@sps/billing/models/payment-intent/backend/repository/database";
import { Configuration } from "../../../../api/src/lib/configuration";
import { Middleware, privateReadRoutes } from "./index";

const publicIntent = {
  id: "449cc401-43b5-4bdc-9a70-4f7b9db1d596",
  createdAt: new Date("2026-11-17T00:00:00Z"),
  updatedAt: new Date("2026-11-17T00:00:00Z"),
  variant: "default",
  amount: 20,
  status: "processing",
  interval: null,
  type: "one_off",
};
const internalIntent = {
  ...publicIntent,
  checkoutProvider: "dummy",
  checkoutCurrencyId: "efc4a3b1-3c35-481f-88f1-3a07744863a4",
  checkoutMetadata: {
    email: "private@example.test",
    destination: { address: "Private address" },
    orders: [{ id: "private-order" }],
  },
  checkoutDispatchState: "dispatched",
  checkoutDispatchStartedAt: new Date("2026-11-17T00:00:00Z"),
};
const wireIntent = JSON.parse(JSON.stringify(publicIntent));
const route = "/api/billing/payment-intents";

interface IBoundaryEnv {
  Variables: Record<typeof RBAC_PRIVILEGED_CONTEXT_KEY, boolean>;
}

function boundary(privileged = false) {
  const app = new Hono<IBoundaryEnv>();
  app.use(async (c, next) => {
    if (privileged) {
      c.set(RBAC_PRIVILEGED_CONTEXT_KEY, true);
    }
    await next();
  });
  app.use(new Middleware().init());
  return app;
}

test("the configured wire schema preserves legacy fields and disables payment data dumps", () => {
  const configuration = new Configuration();
  expect(configuration.repository.outputSchema?.parse(internalIntent)).toEqual(
    publicIntent,
  );
  expect(outputSchema.parse(internalIntent)).toEqual(publicIntent);
  expect(privateCheckoutFields).toEqual([
    "checkoutProvider",
    "checkoutCurrencyId",
    "checkoutMetadata",
    "checkoutDispatchState",
    "checkoutDispatchStartedAt",
  ]);
  expect(configuration.repository.dump?.active).toBe(false);
  expect(configuration.repository.seed?.active).toBe(false);
});

test.each([false, true])(
  "all HTTP responses omit recovery context even with trusted operator=%s",
  async (privileged) => {
    const app = boundary(privileged);
    app.all("*", (c) =>
      c.json({
        data: [internalIntent],
        related: { intent: internalIntent },
        legacy: { paymentUrl: "https://example.test/pay", status: "open" },
      }),
    );
    for (const [path, method] of [
      [route, "GET"],
      [`${route}/${publicIntent.id}`, "GET"],
      [`${route}/${publicIntent.id}/check`, "POST"],
      [`${route}/find-or-create`, "POST"],
    ]) {
      const response = await app.request(path, { method });
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        data: [wireIntent],
        related: { intent: wireIntent },
        legacy: { paymentUrl: "https://example.test/pay", status: "open" },
      });
    }
  },
);

test("configured generic find-or-create output and its privileged bypass are both safe at the HTTP boundary", async () => {
  const configuration = new Configuration();
  for (const privileged of [false, true]) {
    const app = boundary(privileged);
    app.post("*", (c) => {
      const data = applyOutputSchema({
        c,
        service: { repository: { configuration } } as any,
        data: internalIntent,
      });
      return c.json({ data });
    });
    const response = await app.request(`${route}/find-or-create`, {
      method: "POST",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: wireIntent });
  }
});

test("outer observers receive the sanitized write result", async () => {
  const app = new Hono<IBoundaryEnv>();
  let eventPayload: unknown;
  app.use(async (c, next) => {
    c.set(RBAC_PRIVILEGED_CONTEXT_KEY, true);
    await next();
    eventPayload = await c.res.clone().json();
  });
  app.use(new Middleware().init());
  app.post("*", (c) => c.json({ data: internalIntent }));
  await app.request(route, { method: "POST" });
  expect(eventPayload).toEqual({ data: wireIntent });
});

test("ordinary filters and writes remain available while private predicates and sort columns are rejected", async () => {
  const app = boundary();
  const handler = jest.fn((c: Context<IBoundaryEnv>) =>
    c.json({ data: internalIntent }),
  );
  app.all("*", handler);
  const publicQuery = qs.stringify({
    filters: { and: [{ column: "status", method: "eq", value: "processing" }] },
  });
  expect((await app.request(`${route}?${publicQuery}`)).status).toBe(200);
  for (const params of [
    { filters: { and: [{ column: "checkoutMetadata", method: "isNotNull" }] } },
    { orderBy: { column: "checkoutDispatchStartedAt", method: "desc" } },
    { checkoutCurrencyId: internalIntent.checkoutCurrencyId },
  ]) {
    const response = await app.request(
      `${route}/count?${qs.stringify(params)}`,
    );
    expect(response.status).toBe(400);
  }
  expect(handler).toHaveBeenCalledTimes(1);
});

test.each(["application/json", "application/x-www-form-urlencoded"])(
  "payload privilege claims cannot write recovery context through %s",
  async (contentType) => {
    const app = boundary();
    const handler = jest.fn((c: Context<IBoundaryEnv>) =>
      c.json({ data: internalIntent }),
    );
    app.all("*", handler);
    const data = {
      operator: true,
      role: "admin",
      data: { checkoutMetadata: { email: "private@example.test" } },
    };
    const body =
      contentType === "application/json"
        ? JSON.stringify(data)
        : new URLSearchParams({ data: JSON.stringify(data) }).toString();
    const response = await app.request(`${route}/find-or-create`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  },
);

test("operators may inspect private predicates internally without exposing private fields in the response", async () => {
  const app = boundary(true);
  app.get("*", (c) => c.json({ data: internalIntent }));
  const query = qs.stringify({
    filters: {
      and: [
        { column: "checkoutDispatchState", method: "eq", value: "dispatched" },
      ],
    },
  });
  const response = await app.request(`${route}?${query}`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: wireIntent });
});

test("provider webhook payloads and text acknowledgements retain their existing contract", async () => {
  const app = boundary();
  app.post("*", async (c) => {
    const payload = await c.req.json();
    expect(payload.checkoutMetadata).toEqual({ providerSpecific: true });
    return c.text("OK");
  });
  const response = await app.request(`${route}/dummy/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutMetadata: { providerSpecific: true } }),
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("OK");
});

test("cache exclusion matches only payment-intent reads", () => {
  const matches = (path: string, method: string) =>
    privateReadRoutes.some(
      (rule) => rule.regexPath.test(path) && rule.methods?.includes(method),
    );
  expect(matches(route, "GET")).toBe(true);
  expect(matches(`${route}/${publicIntent.id}`, "HEAD")).toBe(true);
  expect(matches(`${route}-to-invoices`, "GET")).toBe(false);
  expect(matches(`${route}/dummy/webhook`, "POST")).toBe(false);
});
