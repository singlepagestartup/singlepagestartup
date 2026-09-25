/**
 * BDD Suite: is-authorized controller credentials.
 *
 * Given: the is-authorized handler mounted on a Hono app, with the
 *        permission decision answered by a stubbed service.
 * When: a caller presents the operator secret or a subject JWT in a header or
 *       only in a cookie.
 * Then: only the X-RBAC-SECRET-KEY header short-circuits to ok, a wrong secret
 *       is refused, and a credential held only in a cookie reaches the
 *       permission decision as an anonymous caller.
 */

const mockConfiguredSecret = "configured-operator-secret";

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: mockConfiguredSecret,
  };
});

import { Hono } from "hono";
import { Handler } from "./index";

const PERMISSION_QUERY =
  "permission[route]=%2Fapi%2Fecommerce%2Forders&permission[method]=GET";

function createIsAuthorizedRoute() {
  const service = {
    isAuthorized: jest.fn().mockResolvedValue({ ok: true }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.get("/is-authorized", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: the is-authorized controller answers a permission question", () => {
  /**
   * BDD Scenario: the operator secret in its header.
   *
   * Given: a caller sends the configured secret in X-RBAC-SECRET-KEY.
   * When: the controller answers.
   * Then: it returns ok without asking the permission service.
   */
  it("answers ok for the configured X-RBAC-SECRET-KEY header", async () => {
    const { hono, service } = createIsAuthorizedRoute();

    const response = await hono.request(`/is-authorized?${PERMISSION_QUERY}`, {
      headers: { "X-RBAC-SECRET-KEY": mockConfiguredSecret },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { ok: true } });
    expect(service.isAuthorized).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a wrong secret in the header.
   *
   * Given: a caller sends a secret that does not match.
   * When: the controller answers.
   * Then: the request is refused without asking the permission service.
   */
  it("refuses a wrong X-RBAC-SECRET-KEY header", async () => {
    const { hono, service } = createIsAuthorizedRoute();

    const response = await hono.request(`/is-authorized?${PERMISSION_QUERY}`, {
      headers: { "X-RBAC-SECRET-KEY": "not-the-configured-secret" },
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(service.isAuthorized).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the operator secret only in a cookie.
   *
   * Given: a caller holds the configured secret only in an rbac.secret-key
   *        cookie and the permission service refuses anonymous callers.
   * When: the controller answers.
   * Then: the secret is ignored and the permission service decides, so the
   *       request is refused.
   */
  it("ignores a secret that arrives only in a cookie", async () => {
    const { hono, service } = createIsAuthorizedRoute();

    service.isAuthorized.mockRejectedValue(
      new Error("Permission error. You do not have access to this resource"),
    );

    const response = await hono.request(`/is-authorized?${PERMISSION_QUERY}`, {
      headers: { Cookie: `rbac.secret-key=${mockConfiguredSecret}` },
    });

    expect(response.status).toBe(403);
    expect(service.isAuthorized).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a subject JWT in the Authorization header.
   *
   * Given: a caller forwards a subject JWT as Authorization.
   * When: the controller answers.
   * Then: the permission service decides for that token.
   */
  it("hands a bearer JWT to the permission decision", async () => {
    const { hono, service } = createIsAuthorizedRoute();

    const response = await hono.request(`/is-authorized?${PERMISSION_QUERY}`, {
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(response.status).toBe(200);
    expect(service.isAuthorized).toHaveBeenCalledWith({
      permission: {
        route: "/api/ecommerce/orders",
        method: "GET",
        type: "HTTP",
      },
      authorization: { value: "header-jwt" },
    });
  });

  /**
   * BDD Scenario: a subject JWT only in a cookie.
   *
   * Given: a caller holds a subject JWT only in an rbac.subject.jwt cookie.
   * When: the controller answers.
   * Then: the permission service decides for an anonymous caller.
   */
  it("hands a JWT held only in a cookie to the decision as anonymous", async () => {
    const { hono, service } = createIsAuthorizedRoute();

    await hono.request(`/is-authorized?${PERMISSION_QUERY}`, {
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(service.isAuthorized.mock.calls[0][0].authorization).toEqual({
      value: undefined,
    });
  });
});
