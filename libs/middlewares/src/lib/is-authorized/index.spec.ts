/**
 * BDD Suite: credentials accepted by the is-authorized middleware.
 *
 * Given: a protected API route behind the is-authorized middleware, with the
 *        permission check answered by a stubbed subject SDK.
 * When: a request presents the operator secret or a subject JWT in a header
 *       or only in a cookie.
 * Then: only the X-RBAC-SECRET-KEY header marks the request as the operator,
 *       and a credential held only in a cookie reaches the permission check as
 *       an anonymous caller.
 */

const mockConfiguredSecret = "configured-operator-secret";
const mockAuthenticationIsAuthorized = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: mockConfiguredSecret,
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      authenticationIsAuthorized: (...args: unknown[]) =>
        mockAuthenticationIsAuthorized(...args),
    },
  };
});

import { Hono } from "hono";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { Middleware } from "./index";

function createProtectedRoute() {
  const handler = jest.fn((c: any) =>
    c.json({ privileged: Boolean(c.get(RBAC_PRIVILEGED_CONTEXT_KEY)) }),
  );
  const hono = new Hono();

  hono.use(new Middleware().init());
  hono.get("/api/ecommerce/orders/:scenario", handler);

  return { handler, hono };
}

function forwardedHeaders() {
  return mockAuthenticationIsAuthorized.mock.calls[0][0].options.headers;
}

describe("Given: a protected route behind the is-authorized middleware", () => {
  beforeEach(() => {
    mockAuthenticationIsAuthorized.mockReset();
    mockAuthenticationIsAuthorized.mockRejectedValue(
      new Error("Permission error. You do not have access to this resource"),
    );
  });

  /**
   * BDD Scenario: the operator secret in its header.
   *
   * Given: a request carries the configured secret in X-RBAC-SECRET-KEY.
   * When: the middleware evaluates it.
   * Then: the handler runs with the request marked as the operator, without a
   *       permission check.
   */
  it("marks a request with the X-RBAC-SECRET-KEY header as the operator", async () => {
    const { handler, hono } = createProtectedRoute();

    const response = await hono.request("/api/ecommerce/orders/secret-header", {
      headers: { "X-RBAC-SECRET-KEY": mockConfiguredSecret },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ privileged: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockAuthenticationIsAuthorized).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the operator secret only in a cookie.
   *
   * Given: a request carries the configured secret only in an rbac.secret-key
   *        cookie, and the route is not open to anonymous callers.
   * When: the middleware evaluates it.
   * Then: the request is not marked as the operator, the permission check
   *       receives no secret, and the refusal stops the request.
   */
  it("sends a request with the secret only in a cookie to the permission check without it", async () => {
    const { handler, hono } = createProtectedRoute();

    const response = await hono.request("/api/ecommerce/orders/secret-cookie", {
      headers: { Cookie: `rbac.secret-key=${mockConfiguredSecret}` },
    });

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(mockAuthenticationIsAuthorized).toHaveBeenCalledTimes(1);
    expect(forwardedHeaders()).not.toHaveProperty("X-RBAC-SECRET-KEY");
  });

  /**
   * BDD Scenario: a subject JWT only in a cookie.
   *
   * Given: a request carries a JWT only in an rbac.subject.jwt cookie, and the
   *        route is not open to anonymous callers.
   * When: the middleware evaluates it.
   * Then: the permission check receives no Authorization header, so the
   *       caller is anonymous and the refusal stops the request.
   */
  it("sends a JWT held only in a cookie to the permission check as anonymous", async () => {
    const { handler, hono } = createProtectedRoute();

    const response = await hono.request("/api/ecommerce/orders/jwt-cookie", {
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(forwardedHeaders()).not.toHaveProperty("Authorization");
  });

  /**
   * BDD Scenario: a subject JWT in the Authorization header.
   *
   * Given: a request carries a JWT as Authorization: Bearer and the
   *        permission check allows that subject.
   * When: the middleware evaluates it.
   * Then: the permission check receives the token and the handler runs
   *       without operator privileges.
   */
  it("forwards a bearer JWT to the permission check", async () => {
    mockAuthenticationIsAuthorized.mockResolvedValue({ ok: true });

    const { handler, hono } = createProtectedRoute();

    const response = await hono.request("/api/ecommerce/orders/jwt-header", {
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ privileged: false });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(forwardedHeaders()).toMatchObject({ Authorization: "header-jwt" });
  });
});
