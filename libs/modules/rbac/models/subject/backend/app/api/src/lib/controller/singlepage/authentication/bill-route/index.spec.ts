/**
 * BDD Suite: bill-route controller credentials.
 *
 * Given: the bill-route handler mounted on a Hono app, with the billing
 *        decision answered by a stubbed service.
 * When: a caller presents the operator secret or a subject JWT in a header or
 *       only in a cookie.
 * Then: only the X-RBAC-SECRET-KEY header short-circuits to ok, and a
 *       credential held only in a cookie reaches the billing decision as an
 *       anonymous caller.
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
  "permission[route]=%2Fapi%2Fbilled&permission[method]=POST";

function createBillRoute() {
  const service = {
    billRoute: jest.fn().mockResolvedValue({ ok: true }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.post("/bill-route", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: the bill-route controller answers a billing question", () => {
  /**
   * BDD Scenario: the operator secret in its header.
   *
   * Given: a caller sends the configured secret in X-RBAC-SECRET-KEY.
   * When: the controller answers.
   * Then: it returns ok without billing anyone.
   */
  it("answers ok for the configured X-RBAC-SECRET-KEY header", async () => {
    const { hono, service } = createBillRoute();

    const response = await hono.request(`/bill-route?${PERMISSION_QUERY}`, {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": mockConfiguredSecret },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { ok: true } });
    expect(service.billRoute).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the operator secret only in a cookie.
   *
   * Given: a caller holds the configured secret only in an rbac.secret-key
   *        cookie.
   * When: the controller answers.
   * Then: the secret is ignored and the billing service decides for an
   *       anonymous caller.
   */
  it("ignores a secret that arrives only in a cookie", async () => {
    const { hono, service } = createBillRoute();

    await hono.request(`/bill-route?${PERMISSION_QUERY}`, {
      method: "POST",
      headers: { Cookie: `rbac.secret-key=${mockConfiguredSecret}` },
    });

    expect(service.billRoute).toHaveBeenCalledTimes(1);
    expect(service.billRoute.mock.calls[0][0].authorization).toEqual({
      value: undefined,
    });
  });

  /**
   * BDD Scenario: a subject JWT in the Authorization header.
   *
   * Given: a caller forwards a subject JWT as Authorization.
   * When: the controller answers.
   * Then: the billing service decides for that token.
   */
  it("hands a bearer JWT to the billing decision", async () => {
    const { hono, service } = createBillRoute();

    await hono.request(`/bill-route?${PERMISSION_QUERY}`, {
      method: "POST",
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(service.billRoute.mock.calls[0][0].authorization).toEqual({
      value: "header-jwt",
    });
  });

  /**
   * BDD Scenario: a subject JWT only in a cookie.
   *
   * Given: a caller holds a subject JWT only in an rbac.subject.jwt cookie.
   * When: the controller answers.
   * Then: the billing service decides for an anonymous caller.
   */
  it("hands a JWT held only in a cookie to the decision as anonymous", async () => {
    const { hono, service } = createBillRoute();

    await hono.request(`/bill-route?${PERMISSION_QUERY}`, {
      method: "POST",
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(service.billRoute.mock.calls[0][0].authorization).toEqual({
      value: undefined,
    });
  });
});
