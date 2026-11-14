/**
 * BDD Suite: credentials forwarded by the bill-route middleware.
 *
 * Given: a billed route behind the bill-route middleware, with the billing
 *        check answered by a stubbed subject SDK.
 * When: a request presents the operator secret or a subject JWT in a header
 *       or only in a cookie.
 * Then: the billing check receives a credential only when it arrived in its
 *       header.
 */

const mockAuthenticationBillRoute = jest.fn();

jest.mock("@sps/providers-kv", () => {
  return {
    Provider: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      authenticationBillRoute: (...args: unknown[]) =>
        mockAuthenticationBillRoute(...args),
    },
  };
});

import { Hono } from "hono";
import { Middleware } from "./index";

const OPERATOR_SECRET = "operator-secret";

function createBilledRoute() {
  const handler = jest.fn((c: any) => c.json({ ok: true }));
  const hono = new Hono();

  hono.use(
    new Middleware({
      billingRoutes: [{ regexPath: /\/api\/billed/, methods: ["POST"] }],
    }).init(),
  );
  hono.post("/api/billed", handler);

  return { handler, hono };
}

function forwardedHeaders() {
  return mockAuthenticationBillRoute.mock.calls[0][0].options.headers;
}

describe("Given: a billed route behind the bill-route middleware", () => {
  beforeEach(() => {
    mockAuthenticationBillRoute.mockReset();
    mockAuthenticationBillRoute.mockResolvedValue({ ok: true });
  });

  /**
   * BDD Scenario: the operator secret in its header.
   *
   * Given: a request carries the secret in X-RBAC-SECRET-KEY and no JWT.
   * When: the middleware bills the route.
   * Then: the billing check receives the secret header and the route runs.
   */
  it("forwards the X-RBAC-SECRET-KEY header to the billing check", async () => {
    const { handler, hono } = createBilledRoute();

    const response = await hono.request("/api/billed", {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": OPERATOR_SECRET },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(forwardedHeaders()).toEqual({
      "X-RBAC-SECRET-KEY": OPERATOR_SECRET,
    });
  });

  /**
   * BDD Scenario: the operator secret only in a cookie.
   *
   * Given: a request carries the secret only in an rbac.secret-key cookie.
   * When: the middleware bills the route.
   * Then: the billing check receives no credential at all.
   */
  it("does not forward a secret that arrives only in a cookie", async () => {
    const { hono } = createBilledRoute();

    await hono.request("/api/billed", {
      method: "POST",
      headers: { Cookie: `rbac.secret-key=${OPERATOR_SECRET}` },
    });

    expect(mockAuthenticationBillRoute).toHaveBeenCalledTimes(1);
    expect(forwardedHeaders()).toEqual({});
  });

  /**
   * BDD Scenario: a subject JWT in the Authorization header.
   *
   * Given: a request carries a JWT as Authorization: Bearer.
   * When: the middleware bills the route.
   * Then: the billing check receives the token as Authorization.
   */
  it("forwards a bearer JWT to the billing check", async () => {
    const { hono } = createBilledRoute();

    await hono.request("/api/billed", {
      method: "POST",
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(forwardedHeaders()).toEqual({ Authorization: "header-jwt" });
  });

  /**
   * BDD Scenario: a subject JWT only in a cookie.
   *
   * Given: a request carries a JWT only in an rbac.subject.jwt cookie.
   * When: the middleware bills the route.
   * Then: the billing check receives no credential, so it bills an anonymous
   *       caller.
   */
  it("does not forward a JWT that arrives only in a cookie", async () => {
    const { hono } = createBilledRoute();

    await hono.request("/api/billed", {
      method: "POST",
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(forwardedHeaders()).toEqual({});
  });
});
