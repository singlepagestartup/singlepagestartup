/**
 * BDD Suite: subject ownership guard credentials.
 *
 * Given: a subject route guarded by the request-subject-is-owner middleware.
 * When: a request presents the operator secret or the owner's JWT in a header
 *       or only in a cookie.
 * Then: the operator secret passes only in X-RBAC-SECRET-KEY, the owner passes
 *       only with the JWT in the Authorization header, and a credential held
 *       only in a cookie is refused.
 */

const mockConfiguredSecret = "configured-operator-secret";
const mockJwtSecret = "configured-jwt-secret";

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_JWT_SECRET: mockJwtSecret,
    RBAC_SECRET_KEY: mockConfiguredSecret,
  };
});

import { Hono } from "hono";
import * as jwt from "hono/jwt";
import { Middleware } from "./index";

const OWNER_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

function createSubjectRoute() {
  const handler = jest.fn((c: any) => c.json({ ok: true }));
  const hono = new Hono();

  hono.get("/api/rbac/subjects/:id", new Middleware().init(), handler);

  return { handler, hono };
}

function signOwnerJwt() {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 600,
      subject: { id: OWNER_ID },
    },
    mockJwtSecret,
  );
}

describe("Given: a subject route guarded by the ownership middleware", () => {
  /**
   * BDD Scenario: the operator secret in its header.
   *
   * Given: a request carries the configured secret in X-RBAC-SECRET-KEY.
   * When: the guard evaluates it.
   * Then: the route runs without an owner check.
   */
  it("lets the operator through with the X-RBAC-SECRET-KEY header", async () => {
    const { handler, hono } = createSubjectRoute();

    const response = await hono.request(`/api/rbac/subjects/${OWNER_ID}`, {
      headers: { "X-RBAC-SECRET-KEY": mockConfiguredSecret },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the operator secret only in a cookie.
   *
   * Given: a request carries the configured secret only in an rbac.secret-key
   *        cookie and no JWT.
   * When: the guard evaluates it.
   * Then: the request is treated as a caller without a token and refused.
   */
  it("refuses a secret that arrives only in a cookie", async () => {
    const { handler, hono } = createSubjectRoute();

    const response = await hono.request(`/api/rbac/subjects/${OWNER_ID}`, {
      headers: { Cookie: `rbac.secret-key=${mockConfiguredSecret}` },
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("No JWT token provided");
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the owner's JWT in the Authorization header.
   *
   * Given: a request carries a JWT for the subject in the path as a bearer
   *        header.
   * When: the guard evaluates it.
   * Then: the route runs.
   */
  it("lets the owner through with the JWT in the Authorization header", async () => {
    const { handler, hono } = createSubjectRoute();

    const response = await hono.request(`/api/rbac/subjects/${OWNER_ID}`, {
      headers: { Authorization: `Bearer ${await signOwnerJwt()}` },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the owner's JWT only in a cookie.
   *
   * Given: a request carries the owner's JWT only in an rbac.subject.jwt
   *        cookie.
   * When: the guard evaluates it.
   * Then: the request is treated as a caller without a token and refused.
   */
  it("refuses an owner whose JWT arrives only in a cookie", async () => {
    const { handler, hono } = createSubjectRoute();

    const response = await hono.request(`/api/rbac/subjects/${OWNER_ID}`, {
      headers: { Cookie: `rbac.subject.jwt=${await signOwnerJwt()}` },
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("No JWT token provided");
    expect(handler).not.toHaveBeenCalled();
  });
});
